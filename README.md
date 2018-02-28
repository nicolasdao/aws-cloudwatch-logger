# AWS CloudWatch Logger &middot;  [![NPM](https://img.shields.io/npm/v/aws-cloudwatch-log.svg?style=flat)](https://www.npmjs.com/package/aws-cloudwatch-log) [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) [![Neap](https://neap.co/img/made_by_neap.svg)](#this-is-what-we-re-up-to)

Fast & Simple Logging to AWS CloudWatch. It logs in the background without blocking. By default, it will immediately send the log to your configured AWS LogStream. You can also easily configure it so that the logs are buffered for a specific period of time before being sent as a batch to AWS LogStream. This is the recommended way. 

For a quick recap on how logging on AWS CloudWatch works, refer to the [Annex below](#annex-short-explanation-about-logs-in-aws-cloudwatch).   

# Install
```
npm install aws-cloudwatch-log --save
```

# How To Use It
## Basic
_IMPORTANT: In the example below, it is expected that both the __logGroupName__ and the __logStreamName__ have already been created in AWS CloudWatch. aws-cloudwatch-log provides an extra api to create a new logStreamName._

```js
const { Logger } = require('aws-cloudwatch-log')

const config = { 
	logGroupName: 'YourGroupName', 
	logStreamName: 'YourLogStream', 
	region: 'ap-southeast-2', 
	accessKeyId: 'BLABLABLABLABLABLA', 
	secretAccessKey: 'some-very-long-secret', 
	uploadFreq: 10000, 	// Optional. Send logs to AWS LogStream in batches after 10 seconds intervals.
	local: false 		// Optional. If set to true, the log will fall back to the standard 'console.log'.
}

const logger = new Logger(config)

logger.log('Hello World')
logger.log(`I'm`, `aws-cloudwatch-log.`, `I can log many things at once, as well as objects as follow:`)
logger.log({ type: 'this-is-important', details: 'something has happened!' })
logger.log({ category: 'info', details: `I'm fast and lean. I don't block, and everything happens in the background!` })
```

> Notice that the configuration option __uploadFreq__ is set to 10,000 milliseconds. This option is optional. It it is not specified, it's default value is 0, which means that each _log_ action will immediately send the log to AWS LogStream.

## Development Mode
When testing your code locally, you can disable logging to AWS LogStream by setting the __local__ configuration to true. 

## Creating A LogStream
AWS deprecates the usage of the same LogStream by multiple concurrent machine. The recommended method is that each machine creates its own unique LogStream inside a specific LogGroup. To create a LogStream, you can proceed as follow:

```js
const { createLogStream } = require('aws-cloudwatch-log')

const config = { 
	logGroupName: 'YourGroupName', 
	region: 'ap-southeast-2', 
	accessKeyId: 'BLABLABLABLABLABLA', 
	secretAccessKey: 'some-very-long-secret', 
	local: false 		// Optional. If set to true, no LogStream will be created.
}

createLogStream('your-new-unique-logstream', config)
.then(data => console.log('Do whatever you want when it works.'))
.catch(err => console.log('Do whatever you want when it does not work.'))
```

# Annex - Short Explanation About Logs In AWS CloudWatch
Logs and events can't simply being added to CloudWatch. Instead, they are added to a __LogStream__ which belongs to a __LogGroup__. That means that before being able to log an event to CloudWatch, you need to have created both a __LogStream__ and a __LogGroup__. You can either do this within the AWS Web Console inside CloudWatch, or you can programmatically do this (_aws-cloudwatch-log_ allows to create a new LogStream [here](#creating-a-logstream)).

AWS deprecates the usage of the same LogStream by multiple concurrent machine. The recommended method is that each machine creates its own unique LogStream inside a specific LogGroup.

# This Is What We re Up To
We are Neap, an Australian Technology consultancy powering the startup ecosystem in Sydney. We simply love building Tech and also meeting new people, so don't hesitate to connect with us at [https://neap.co](https://neap.co).

Our other open-sourced projects:
#### Web Framework & Deployment Tools
* [__*webfunc*__](https://github.com/nicolasdao/webfunc): Write code for serverless similar to Express once, deploy everywhere. 
* [__*now-flow*__](https://github.com/nicolasdao/now-flow): Automate your Zeit Now Deployments.

#### GraphQL
* [__*graphql-serverless*__](https://github.com/nicolasdao/graphql-serverless): GraphQL (incl. a GraphiQL interface) middleware for [webfunc](https://github.com/nicolasdao/webfunc).
* [__*schemaglue*__](https://github.com/nicolasdao/schemaglue): Naturally breaks down your monolithic graphql schema into bits and pieces and then glue them back together.
* [__*graphql-s2s*__](https://github.com/nicolasdao/graphql-s2s): Add GraphQL Schema support for type inheritance, generic typing, metadata decoration. Transpile the enriched GraphQL string schema into the standard string schema understood by graphql.js and the Apollo server client.
* [__*graphql-authorize*__](https://github.com/nicolasdao/graphql-authorize.git): Authorization middleware for [graphql-serverless](https://github.com/nicolasdao/graphql-serverless). Add inline authorization straight into your GraphQl schema to restrict access to certain fields based on your user's rights.

#### React & React Native
* [__*react-native-game-engine*__](https://github.com/bberak/react-native-game-engine): A lightweight game engine for react native.
* [__*react-native-game-engine-handbook*__](https://github.com/bberak/react-native-game-engine-handbook): A React Native app showcasing some examples using react-native-game-engine.

#### Tools
* [__*aws-cloudwatch-logger*__](https://github.com/nicolasdao/aws-cloudwatch-logger): Promise based logger for AWS CloudWatch LogStream.


# License
Copyright (c) 2018, Neap Pty Ltd.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of Neap Pty Ltd nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL NEAP PTY LTD BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

<p align="center"><a href="https://neap.co" target="_blank"><img src="https://neap.co/img/neap_color_horizontal.png" alt="Neap Pty Ltd logo" title="Neap" height="89" width="200"/></a></p>
