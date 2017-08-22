# sails-hook-hotcron

A [sails hook](http://sailsjs.com/documentation/concepts/extending-sails/hooks) that handles crontab jobs for you. Whenever the configuration file changes, the scheduled job changes correspondingly. No need to restart your sails app.

# Get started

## Install

`npm install --save sails-hook-hotcron`

## Crontab pattern

Please refer to [node-cron](https://github.com/kelektiv/node-cron).

## Config

By default, the configuration path is './config/locales/'(based on your sails app working directory), and the configuration file is named 'cron.json'.

```
└─┬ Your sails app
  ├── api
  ├── assets
  ├─┬ config
  | ├── env
  | └─┬ locales
  |   └── *cron.json*    <-----  Your should put crontab configuration file here
  └─┬ myjob
    └── somejob.js
```

Here is an example `cron.json`, all the fields are must.

```
[
  {
    "name": "JOB_1",
    "class": "./myjob/somejob.js",
    "constructor": "someconstructor", // currently takes only one parameter for constructor
    "args": [], // parameters passed when job.start(args)
    "crontab": "0 0 * * * *" // runs every hour
  }
]

```

## How should I define a job

The job has to be exported as a class which has a start method.
Below is an example.

```
class somejob {
	constructor(sails, name) {
		this.app = sails;
		this.name = name;
	}
	start() {
		this.app.log.info('Job %s start at %s', this.name, new Date());
	}
}

module.exports = somejob;
```
