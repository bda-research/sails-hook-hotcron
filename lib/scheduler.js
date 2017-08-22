
const fs = require('fs');
const chokidar = require('chokidar');
const EventEmitter = require('events').EventEmitter;
const cron = require('cron');
const path = require('path');

class Scheduler extends EventEmitter {
    constructor(app, configPath, configFile) {
	super();
	this.app = app;
	this.configPath = path.join(process.cwd(), configPath);
	this.configFile = configFile;
	this.managedJobs = {};
	this.on('onConfigChange', this.onConfigChange);
    }
    
    onConfigChange() {
	let self = this;
	let config_str = fs.readFileSync(self.configPath+self.configFile).toString();
	
	let config_list = null;
	try {
	    config_list = JSON.parse(config_str);
	} catch(e) {
	    return self.app.log.error('<Scheduler-onConfigChange> Failed to parse config.json: %s', e);
	}

	config_list.forEach(job_config => {
	    if(job_config.name in self.managedJobs) {
		let managed = self.managedJobs[job_config.name];
		if(self.hasChanged(managed, job_config)) {
		    managed.job.stop();
		} else {
		    return;
		}
	    }

	    let job = new cron.CronJob({
		cronTime: job_config.crontab,
		onTick: () => {
		    let task = self.getTask(job_config.class, job_config.constructor);
		    task.start.apply(task, job_config.args);
		}
	    });

	    self.managedJobs[job_config.name] = {
		class: job_config.class,
		constructor: job_config.constructor,
		args: job_config.args,
		crontab: job_config.crontab,
		job: job
	    };

	    job.start();
	    self.app.log.info('<Scheduler-onConfigChange> Add %s to managed fetchers', job_config.name);
	});

    }

    hasChanged(obj_1, obj_2) {
	if(obj_1.class !== obj_2.class) {
	    return true;
	}
	if(obj_1.constructor !== obj_2.constructor) {
	    return true;
	}
	if(JSON.stringify(obj_1.args) !== JSON.stringify(obj_2.args)) {
	    return true;
	}
	if(obj_1.crontab !== obj_2.crontab) {
	    return true;
	}
	return false;
    }

    getTask(className, constructor) {
	let Clazz = require(path.join(process.cwd(), className));
	let task = new Clazz(this.app, constructor);
	return task;
    }

    start() {
	let self = this;
	self.emit('onConfigChange');

	self.watcher = chokidar.watch(path.join(self.configPath, '*.json'), {
	    ignore: new RegExp(`^(?!${self.configFile})[\\s\\S]+$`),
	    persistent: true
	});
	
	self.watcher.on('ready', () => {
	    self.app.log.info('<Scheduler-watcher> Initial scan complete. Ready for changes.');
	}).on('error', (error) => {
	    self.app.log.error('<Scheduler-watcher> Watcher error: %s', error);
	}).on('change', (path) => {
	    self.app.log.info('<Scheduler-watcher> witness a change on %s', path);
	    if(path.indexOf(self.configFile) === -1 ) {
		return;
	    } else {
		self.emit('onConfigChange');
	    }
	});
    }
}

module.exports = Scheduler;
