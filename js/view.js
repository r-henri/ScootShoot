 var StationCreateView = Backbone.View.extend({
    tagName: 'div',
    initialize: function(){
        _.bindAll(this, 'render', 'unrender');
    },
    events: {
        'click button#stations_create_button': 'createStations'
    },
    render: function(){
        var that = this;
        $.get('templates/station_create_form.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template);
        }, 'html');
        
        return this;
    },
    unrender: function(){
        this.remove();
    },
    createStations : function() {
        var numStations = $('#stations_count_input').val();
        
        this.unrender();
        
        var shooterListModel = new ShooterListModel();
        
        for (i = 0; i < numStations; i++) {
            var station = new Station();
              station.set({
                station_id: i + 1,
                station_name: i + 1
              });
  
            shooterListModel.get('stationList').add(station);
        }
        
        stationListView = new StationListView(shooterListModel);
        appView = stationListView;
        
        SaveShooterListModel();
        
        $('#container').append(appView.render().el);
    }
});

var StationView = Backbone.View.extend({
    tagName: 'tr',
    initialize: function(numStations){
        _.bindAll(this, 'render', 'skipShooter');
    },
    render: function(){
        var that = this;
        
        $.get('templates/station_row.html', function (data) {
            template = _.template(data);
            that.$el.html(template(that.model.toJSON()));
        }, 'html');
        
        return this; // for chainable calls, like .render().el
    },
    events: {
        'click button.skip-button': 'skipShooter'
    },
    skipShooter: function() {
        var station = this.model;
        var shooterId = station.get('shooter_id');
        
        if (0 < shooterId) {
            stationListView.skipRound(station, shooterId);
        }
    }
});

var ShooterView = Backbone.View.extend({
    tagName: 'tr',
    initialize: function(numStations){
        _.bindAll(this, 'render', 'deleteShooter');
    },
    render: function(){
        var that = this;
        
        $.get('templates/shooter_row.html', function(data) {
            template = _.template(data);
            that.$el.html(template(that.model.toJSON()));
        }, 'html');
        
        return this;
    },
    events: {
        'click button.delete-button': 'deleteShooter'
    },
    deleteShooter: function() {
        this.model.destroy();

        SaveShooterListModel();
       
        $(this.el).remove();
    }
});

var LogView = Backbone.View.extend({
    tagName: 'tr',
    render: function() {
        var that = this;
        
        $.get('templates/log_row.html', function(data) {
            template = _.template(data);
            that.$el.html(template(that.model.toJSON()));
        }, 'html');
        
        return this;
    }
});

var StationListView = Backbone.View.extend({
     tagName: 'div',
     initialize: function(shooterListModel, skipRound) {
        _.bindAll(this, 'render', 'saveShooter', 'nextRound', 'reset');
        
        this.model = shooterListModel;
    },
    render: function(){
        var that = this;
        $.get('templates/station_list.html', function (data) {
            template = _.template(data, {});
            that.$el.html(template(that.model.toJSON()));
        
            _(that.model.get('stationList').models).each(function(item) {
                
                var stationView = new StationView({
                    model: item
                });
                  
                $('#station_table', that.el).append(stationView.render().el);
            }, that);
            
            _(that.model.get('shooterList').models).each(function(item) {
                var shooterView = new ShooterView({
                    model: item
                });
                
                $('#shooter_table', that.el).append(shooterView.render().el);
            }, that);
            
            _(that.model.get('logList').models).each(function(item) {
                var logView = new LogView({
                    model: item
                });
                
                $('#shooter_log_table', that.el).append(logView.render().el);
            });
        }, 'html');

        return this;
    },
    events: {
        'click #save_shooter_button': 'saveShooter',
        'click #reset_button': 'reset',
        'click #next_round_button': 'nextRound'
    },
    saveShooter: function() {
        var shooterNameInput = $('#shooter_name_input');
        var shooterName = shooterNameInput.val().trim();
        
        if ('' == shooterName) {
            alert('A shooter name is required.');
            $('#shooter_name_input').focus();
            return;
        }
        
        for (var i = 0; i < stationListView.model.get('shooterList').length; i++) {
            var existingName = stationListView.model.get('shooterList').models[i].get('shooter_name');
            if (existingName == shooterName) {
                alert('Name "' + shooterName + '" is already taken, choose another.');
                $('#shooter_name_input').focus();
                return;
            }
        }
        
        var shooterId = this.model.get('highestShooterId') + 1;
        this.model.set('highestShooterId', shooterId);
        
        var testShooter = new Shooter();
        testShooter.set({
            shooter_id: shooterId,
            shooter_name: shooterName,
            stations_shot: new Set()
        });

        this.model.get('shooterList').add(testShooter);
        
        SaveShooterListModel();
        
        var shooterView = new ShooterView({
            model: testShooter
        });
          
        $('#shooter_table', this.el).append(shooterView.render().el);
        
        $('#new_shooter_model').modal('hide');
        shooterNameInput.val('');
    },
    nextRound: function() {
        var currentRound = this.model.get('currentRound');
        var nextRound = currentRound + 1;
        this.model.set('currentRound', nextRound);
        
        var stationCount = this.model.get('stationList').length;
        var shooterCount = this.model.get('shooterList').length;
        
        // clear shooterstations if they have been to all
        for (var i = 0; i < shooterCount; i++) {
            var shooter = this.model.get('shooterList').models[i];
            
            shooter.set('shooting', false);
            
            if (shooter.get('stations_shot').size >= stationCount) {
                shooter.get('stations_shot').clear();
            }
        }
        
        for (var i = 0; i < stationCount; i++) {
            var station = this.model.get('stationList').models[i];
            
            station.set('shooter_id', null);
            station.set('shooter_name', 'n/a');
        }
        
        // find shooter for each station
        this.model.get('shooterList').orderByLastRound();
        var shootersFound = 0;
        var currentStations = new Set();
        for (var i = 0; i < shooterCount; i++) {
            var shooter = this.model.get('shooterList').models[i];
            var shooterId = shooter.get('shooter_id');
            var shooterName = shooter.get('shooter_name');
            var foundStation = false;
            
            if (shootersFound < stationCount) {
                for (var j = 0; j < stationCount; j++) {
                    var station = this.model.get('stationList').models[(j + currentRound) % stationCount];
                    var stationId = station.get('station_id');
                    
                    if (false == currentStations.has(stationId)) {
                        if ((1 == stationCount || stationId != shooter.get('last_station')) && false == shooter.get('stations_shot').has(stationId)) {
                            foundStation = true;
                            
                            shooter.get('stations_shot').add(stationId);
                            shooter.set('last_round_shot', nextRound);
                            shooter.set('last_station', stationId);
                            shooter.set('consecutive_rounds', shooter.get('consecutive_rounds') + 1);
                            shooter.set('shooting', true);
                            
                            station.set('shooter_id', shooterId);
                            station.set('shooter_name', shooterName);
                    
                            shootersFound += 1;
                            currentStations.add(stationId);

                            break;
                        }
                    }
                }
            }
            
            if (false == foundStation) {
                shooter.set('consecutive_rounds', 0);
            }
        }
        
        // add to log
        var logText = '';
        for (var i = 0; i < stationCount; i++) {
            var station = this.model.get('stationList').models[i];
            var stationName = station.get('station_name');
            var shooterName = station.get('shooter_name');

            logText += stationName + ': ' + shooterName;
            
            if (i + 1 < stationCount) {
                logText += '<br />'
            }
        }
        
        var log = new Log();
        log.set({
            round: nextRound,
            logText: logText
        });     
        this.model.get('logList').unshift(log);
        
        this.model.get('shooterList').orderById();
        
        SaveShooterListModel();
        
        $('#next_round_model').modal('hide');
        this.render();
        $('.fade').remove();
    },
    skipRound: function(station, currentShooterId) {
        var nextShooterId = null;
        var nextShooterName = 'n/a';
        var stationId = station.get('station_id');
        
        var currentShooter = null;
        var shooterCount = this.model.get('shooterList').length;
        for (var i = 0; i < shooterCount; i++) {
            var shooter = this.model.get('shooterList').models[i];
            
            if (shooter.get('shooter_id') == currentShooterId) {
                currentShooter = shooter;
                break;
            }
        }
        
        if (currentShooter) {
            currentShooter.get('stations_shot').delete(stationId);
            currentShooter.set('last_round_shot', -1);
        }
        
        this.model.get('shooterList').orderByLastRound();
        
        for (var i = 0; i < shooterCount; i++) {
            var nextShooter = this.model.get('shooterList').models[i];
            
            if (false == nextShooter.get('shooting') && false == nextShooter.get('stations_shot').has(stationId)) {
                nextShooterId = nextShooter.get('shooter_id');
                nextShooterName = nextShooter.get('shooter_name');
                
                nextShooter.set('shooting', true);
                nextShooter.get('stations_shot').add(stationId);
                nextShooter.set('last_round_shot', this.model.get('currentRound'));
                
                break;
            }
        }
        
        this.model.get('shooterList').orderById();

        station.set('shooter_id', nextShooterId);
        station.set('shooter_name', nextShooterName);
        
        SaveShooterListModel();
        
        this.render();
    },
    reset: function() {
        delete localStorage.shooterListModel;
        location.reload();
    }
});
