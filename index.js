/**
* Copyright (c) 2017, Neap Pty Ltd.
* All rights reserved.
* 
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

const axios = require('axios')
const aws4  = require('aws4')

const getRequestParams = (method, region, payload, keys={}) => {
	if (!region)
		throw new Error('Missing required argument: \'region\' is required.')
	if (!method)
		throw new Error('Missing required argument: \'method\' is required.')

	let opts = {
		service: 'logs', 
		region: region, 
		path: `/?Action=${method}`, 
		headers: { 
			'X-Amz-Target': `Logs_20140328.${method}`,
			'Accept': 'application/json',
			'Content-Type': 'application/x-amz-json-1.1'
		}
	}

	if (payload)
		opts.body = JSON.stringify(payload)

	if (keys.accessKeyId && keys.secretAccessKey)
		aws4.sign(opts, { accessKeyId: keys.accessKeyId, secretAccessKey: keys.secretAccessKey })
	else
		aws4.sign(opts)

	return {
		uri: `https://${opts.hostname}${opts.path}`,
		headers: opts.headers
	}
}

const createLogStream = (logStreamName, { logGroupName, region, accessKeyId, secretAccessKey, local }) => {
	if (local && local != 'false')
		return Promise.resolve({ message: 'No need to create stream. Local mode is on.' })

	if (!logGroupName)
		throw new Error('Missing required argument: \'logGroupName\' is required.')
	if (!logStreamName)
		throw new Error('Missing required argument: \'logStreamName\' is required.')
	if (!secretAccessKey)
		throw new Error('Missing required argument: \'secretAccessKey\' is required.')
	if (!accessKeyId)
		throw new Error('Missing required argument: \'accessKeyId\' is required.')
	if (!region)
		throw new Error('Missing required argument: \'region\' is required.')

	const service = 'CreateLogStream'
	const payload = {
		logGroupName: logGroupName,
		logStreamName: logStreamName
	}

	const { uri, headers } = getRequestParams(service, region, payload, { accessKeyId, secretAccessKey })

	const request = axios.create({
		baseURL: uri,
		headers: headers
	})

	return request.post('', payload)
		.then(results => results.data)
		.catch(err => {
			throw new Error(err.response.data.message)
		})
}

const _sequenceTokens = new Map()
/**
* Adds logs to a AWS CloudWatch log stream
* @param  {String|Object|Array} 	entry         	If type is Object it must be structured as follow: { message: ..., timestamp: ... }
*                                               	where 'message' must be a string and 'timestamp' must be an UTC date number 
*                                               	(e.g. Date.now())
*                                               	If type is Array, then each item must either be a string or an object { message: ..., timestamp: ... }
*                                               	following the same rules as above.
* @param  {String} 				logGroupName  	[description]
* @param  {String} 				logStreamName 	[description]
* @param  {String} 				region        	[description]
* @param  {Object} 				keys          	{ accessKeyId: ..., secretAccessKey: ... }
* @param  {String} 				sequenceToken 	[description]
* @param  {Number} 				retryCount    	[description]
* @return {Promise}               					[description]
*/
const addLogsToStream = (entry, logGroupName, logStreamName, region, keys={}, sequenceToken='', retryCount=0) => {
	if (!logGroupName)
		throw new Error('Missing required argument: \'logGroupName\' is required.')
	if (!logStreamName)
		throw new Error('Missing required argument: \'logStreamName\' is required.')
	if (!entry)
		throw new Error('Missing required argument: \'entry\' is required.')

	const entryType = typeof(entry)
	const now = Date.now()

	const events = 
	// entry is a message
	entryType == 'string' ? [{ message: entry, timestamp: now }] :
	// entry is a well-formatted log event
		entryType == 'object' && entry.timestamp ? [{ message: entry.message, timestamp: entry.timestamp }] :
			// entry is an array of items
			entry.length > 0 ? entry.map(e => 
				typeof(e) == 'string' ? { message: e, timestamp: now } :
					e.timestamp ? { message: e.message, timestamp: e.timestamp } : null).filter(x => x)
				: null

	const nothingToLog = events == null

	const service = 'PutLogEvents'
	let payload = {
		logEvents: events,
		logGroupName: logGroupName,
		logStreamName: logStreamName
	}

	const tokenKey = logGroupName + '__' + logStreamName
	sequenceToken = sequenceToken || _sequenceTokens.get(tokenKey)
	if (sequenceToken)
		payload.sequenceToken = sequenceToken

	const { uri, headers } = getRequestParams(service, region, payload, keys)

	const request = axios.create({
		baseURL: uri,
		headers: headers
	})

	return retryCount > 3 || nothingToLog ? Promise.resolve(null) : request.post('', payload)
		.then(results => {
		//console.log('Yes')
			const token = results.data.nextSequenceToken
			_sequenceTokens.set(tokenKey, token)
		})
		.catch(err => {
		//console.log('Oops')
			const token = err.response && err.response.data && err.response.data.expectedSequenceToken
			if (token) {
				_sequenceTokens.set(tokenKey, token)
				retryCount += 1
				return addLogsToStream(entry, logGroupName, logStreamName, region, keys, token, retryCount)
			}
			else 
			if (err.response && err.response.data) {
				err = err.response.data
			}
			console.error(err)

		})
}

const delayFn = (fn,time) => makeQuerablePromise((new Promise((onSuccess) => setTimeout(() => onSuccess(), time))).then(() => fn()))
const makeQuerablePromise = promise => {
// Don't modify any promise that has been already modified.
	if (promise.isResolved) return promise

	// Set initial state
	let isPending = true
	let isRejected = false
	let isFulfilled = false

	// Observe the promise, saving the fulfillment in a closure scope.
	let result = promise.then(
		v => {
			isFulfilled = true
			isPending = false
			return v
		}, 
		e => {
			isRejected = true
			isPending = false
			throw e
		}
	)

	result.isFulfilled = () => isFulfilled
	result.isPending = () => isPending
	result.isRejected = () => isRejected
	return result
}

const _logbuffer = new WeakMap()
const Logger = class {
	constructor({ logGroupName, logStreamName, region, accessKeyId, secretAccessKey, uploadFreq, local }) {
		if (!logGroupName)
			throw new Error('Missing required argument: \'logGroupName\' is required.')
		if (!logStreamName)
			throw new Error('Missing required argument: \'logStreamName\' is required.')
		if (!region)
			throw new Error('Missing required argument: \'region\' is required.')
		if (!secretAccessKey)
			throw new Error('Missing required argument: \'secretAccessKey\' is required.')
		if (!accessKeyId)
			throw new Error('Missing required argument: \'accessKeyId\' is required.')

		const keys = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : {}

		let log
		if (!uploadFreq || uploadFreq < 0) {
			log = (...args) => {
				const logs = (args || []).map(x => JSON.stringify(x))
				// console.log('Logging now...')
				// console.log(logs)
				addLogsToStream(logs, logGroupName, logStreamName, region, keys)
			}
		}
		else {
			log = (...args) => {
			// 1. Accumulate all logs
				const now = Date.now()
				const logs = (args || []).map(x => ({ message: JSON.stringify(x), timestamp: now }))
				let latestBuffer = (_logbuffer.get(this) || { latest: now, data: [], job: null })
				latestBuffer.data = latestBuffer.data.concat(logs)

				// 2. If no job has ever been started, start it, or if the job is ready to process more
				if (!latestBuffer.job || !latestBuffer.job.isPending()) {
					latestBuffer.job = makeQuerablePromise(delayFn(() => {
						const { latest, data, job } = (_logbuffer.get(this) || { latest: now, data: [], job: null })
						// console.log('Finally logging now...')
						// console.log(data)
						_logbuffer.set(this, { latest, data:[], job })
						addLogsToStream(data, logGroupName, logStreamName, region, keys)
					}, uploadFreq))
				}
				//console.log('Buffering logs now...')
				// 3. In any case, memoize 
				_logbuffer.set(this, latestBuffer)
			}
		}

		this.log = local && local != 'false' ? console.log : log
	}
}

module.exports = {
	createLogStream,
	Logger
}
