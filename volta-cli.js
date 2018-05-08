const _ = require('lodash');
const Promise = require('bluebird');
var request = Promise.promisify(require('request'), {multiArgs: true});

let yargs = require('yargs');

let apiHelpers = {
    getStationStatus: function () {
        return api.getStations().spread((resp, body) => {
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

    //Sub-commnd; Status
    yargs
        .demandCommand(1, '"stations" command demands a sub-command')
        .command('status', 'get the status of all stations', {}, (argv) => {

            console.log('Fetching stations...');

            apiHelpers.getStationStatus().then((stationStatus) => {
                console.log('Fetched: ', stationStatus[0])
            })


        })

}).help().parse();



