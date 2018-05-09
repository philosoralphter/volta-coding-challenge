const _ = require('lodash');
const Promise = require('bluebird');
const chalk = require('chalk');
var request = Promise.promisify(require('request'), {multiArgs: true});

let yargs = require('yargs');

let apiHelpers = {
    getStationStatus: function () {
        process.stdout.write('Fetching stations...');
        return api.getStations().spread((resp, body) => {
            process.stdout.write('Station Status Fetched.\n\n');
            return body;
        });
    }
};

let api = {
    getStations: function () {
        return request({
            url: 'https://api.voltaapi.com/v1/stations',
            json: true
        })
    }
};







//Main Command: stations
yargs.command('stations', 'Get Information about or Operate on stations', (yargs) => {

    yargs
        .demandCommand(1, '"stations" command requires a sub-command!')

    //Sub-command: STATUS
        .command('status', 'get the status of all stations', {}, (yargs) => {


            apiHelpers.getStationStatus().then((stationsStatuses) => {
                let stationSummary = {};

                _.reduce(stationsStatuses, (summary, station) => {
                    summary[station.status] ? summary[station.status]++ : summary[station.status] = 1;
                    return summary;
                }, stationSummary);

                console.log(chalk.bold.underline('\tStation Statuses'));

                console.log(chalk.green('Active:             ', stationSummary.active));
                console.log(chalk.red('Needs Service:        ', stationSummary['needs service']));
                console.log(chalk.blue('Under Construction:  ', stationSummary['under construction']));

            })
        })

}).help().parse();



