 var Station = Backbone.Model.extend({
    defaults: {
        station_id: null,
        station_name: 'n/a',
        shooter_id: null,
        shooter_name: 'n/a'
    }
});

var StationList = Backbone.Collection.extend({
    model: Station
});

var Shooter = Backbone.Model.extend({
    defaults: {
        shooter_id: null,
        shooter_name: 'n/a',
        last_round_shot: 0,
        last_station: 0,
        consecutive_rounds: 0,
        shooting: false,
        stations_shot: new Set()
    }
});

var ShooterList = Backbone.Collection.extend({
    model: Shooter,
    comparator: function(a, b) {
        if('id' == this._order_by) {
            return a.get('shooter_id') - b.get('shooter_id');
        } else if('last_round' == this._order_by) {
            if (a.get('last_round_shot') == b.get('last_round_shot')) {
                return a.get('consecutive_rounds') - b.get('consecutive_rounds');
            } else {
                return a.get('last_round_shot') - b.get('last_round_shot');
            }
        }
    },
    orderById: function() {
        this._order_by = 'id';
        this.sort();
    },
    orderByLastRound: function() {
        this._order_by = 'last_round';
        this.sort();
    },
    _order_by: 'id'
});

var Log = Backbone.Model.extend({
    defaults: {
        round: 0,
        logText: ''
    }
});

var LogList = Backbone.Collection.extend({
    model: Log
});

var ShooterListModel = Backbone.Model.extend({
    defaults: {
        currentRound: 0,
        highestShooterId: 0,
        stationList: new StationList(),
        shooterList: new ShooterList(),
        logList: new LogList()
    }
});
