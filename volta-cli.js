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
    //Sub-Command LIST
        .command('list', 'List station IDs or properties', (yargs) => {
            let listOptions = {
                separator: {
                    alias: 's',
                    // default: '\t'
                },
                table: {
                    alias: 't',
                    default: true
                }
            };

            yargs
        //Listable Items
                .demandCommand(1, '"list" command requires sub-command!')
                .command('cities', 'List cities containing Stations', listOptions, (args) => {
                    listItems('city', args);
                }).command('states', 'List States containing Stations', listOptions, (args) => {
                    listItems('state', args);
                }).command('zips', 'List Zip Codes containing Stations', listOptions, (args) => {
                    listItems('zip_code', args);
                }).command('needs-service', 'List Stations in need of service', listOptions, (args) => {
                    apiHelpers.getStationStatus().then((stationStatuses) => {
                        let stations = _.filter(stationStatuses, (station) => {
                            return station.status.toLowerCase() === 'needs service'
                        });

                        let table = new Table({
                            head: ['id', 'name', 'location']
                        });

                        _.each(stations, (station) => {
                            table.push([station.id, station.name, station.city + ', ' + station.state]);
                        });

                        console.log(table.toString());
                    });
                });


            function listItems(key, args) {
                listStationPropValues(key).then((items) => {
                    if (args.separator) {
                        console.log(items.join(args.separator))
                    } else if (args.table) {
                        outputTabularList(items, ' ')
                    } else {
                        console.log.apply(console, cities);
                    }
                })
            }
        }));

}).help().parse();


function listStationPropValues(prop) {
    return apiHelpers.getStationStatus().then((stationsStatuses) => {
        return Object.keys(_.reduce(stationsStatuses, (acc, station) => {
            let value = _.get(station, prop);
            if (_.isString(value) || _.isNumber(value)) acc[value.toString().toUpperCase()] = true;
            return acc;
        }, {}));
    });
}

//function to output lists in `ls` style
function outputTabularList(items, separator) {
    let longestItem = 0;
    let terminalWidth = process.stdout.columns;
    let columnWidth;
    let columns, rows;
    separator = _.isString(separator) ? separator : '';

    //find longest string
    _.each (items, (item) => {
        try {
            if (item.toString().length > longestItem) longestItem = item.toString().length;
        }catch (e) {
            console.log('Could Not parse Item: ', item)
        }
    });

    columnWidth = longestItem;
    columnWidth +=1; //lil padding so we can read
    columnWidth += separator.length;

    columns = Math.floor(terminalWidth / (columnWidth)) - 1;
    rows = Math.ceil(items.length / columns);

    console.log('Printing cols: ' + columns + ' rows: ' + rows, 'for width: ' + terminalWidth, ' and columnWidth: ', columnWidth);

    let nextItem = 0;
    for (let row=1; row<=rows; row++) {
        for (let column=1; column <= columns; column++) {
            if (items.length > nextItem) {
                process.stdout.write(items[nextItem].toString());

                {
                    let itemLength = items[nextItem].toString().length;
                    while (itemLength <= columnWidth) {
                        process.stdout.write(' ');
                        itemLength++;
                    }
                }

                if (column < columns) {
                    process.stdout.write(separator)
                }

                nextItem++;
            }
        }
        process.stdout.write('\n')
    }
}
