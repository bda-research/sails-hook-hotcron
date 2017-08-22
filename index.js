
const Scheduler = require('./lib/scheduler.js');

function cron(sails) {
    let self = this;
    self.scheduler = null;
    
    return {
	defaults: {
	    hotcron: {
		cronConfigPath: './config/locales/',
		cronConfigFile: 'cron.json'
	    }
	},
	
	initialize: function(cb) {
	    self.scheduler = new Scheduler(sails, sails.config.hotcron.cronConfigPath, sails.config.hotcron.cronConfigFile);
	    self.scheduler.start();
	    cb();
	}
    }
}

module.exports = cron;
