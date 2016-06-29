function SaveShooterListModel() {
    var shooterListModel = stationListView.model;
    var jsonShooterListModelRaw = JSON.stringify(shooterListModel);
    var jsonShooterListModel = JSON.parse(jsonShooterListModelRaw);
    
    var shooterCount = shooterListModel.get('shooterList').length;            
    for (var i = 0; i < shooterCount; i++) {
        var shooter = shooterListModel.get('shooterList').models[i];
        
        var array = Array.from(shooter.get('stations_shot'));
        
        jsonShooterListModel.shooterList[i].stations_shot = JSON.stringify(array);
    }
    
    jsonShooterListModelRaw = JSON.stringify(jsonShooterListModel);
    
    localStorage.shooterListModel = jsonShooterListModelRaw;
}

function ParseShooterListModel(jsonShooterListModel) {
    var shooterListModel = new ShooterListModel();

    shooterListModel.set('currentRound', jsonShooterListModel.currentRound);
    shooterListModel.set('highestShooterId', jsonShooterListModel.highestShooterId);

    for (var i = 0; i < jsonShooterListModel.stationList.length; i++) {
        var jsonStation = jsonShooterListModel.stationList[i];
        
        var station = new Station();
        station.set({
            station_id: jsonStation.station_id,
            station_name: jsonStation.station_name,
            shooter_id: jsonStation.shooter_id,
            shooter_name: jsonStation.shooter_name
        });

        shooterListModel.get('stationList').add(station);
    }
    
    for (var i = 0; i < jsonShooterListModel.shooterList.length; i++) {
        var jsonShooter = jsonShooterListModel.shooterList[i];
        
        var shooter = new Shooter();
        shooter.set({
            shooter_id: jsonShooter.shooter_id,
            shooter_name: jsonShooter.shooter_name,
            last_round_shot: jsonShooter.last_round_shot,
            last_station: jsonShooter.last_station,
            consecutive_rounds: jsonShooter.consecutive_rounds,
            stations_shot: new Set(jsonShooter.stations_shot)
        });
        
        shooterListModel.get('shooterList').add(shooter);
    }
    
    for (var i = 0; i < jsonShooterListModel.logList.length; i++) {
        var jsonLog = jsonShooterListModel.logList[i];
        
        var log = new Log();
        log.set({
            round: jsonLog.round,
            logText: jsonLog.logText
        });
        
        shooterListModel.get('logList').add(log);
    }
    
    return shooterListModel;
}


    
appView = null;
stationCreateView = null;
stationListView = null;

$(document).ready(function() {
    stationCreateView = new StationCreateView();

    if (localStorage.shooterListModel) {
        var jsonShooterListModel = JSON.parse(localStorage.shooterListModel);
        
        var shooterListModel = ParseShooterListModel(jsonShooterListModel);
        
        stationListView = new StationListView(shooterListModel);
        appView = stationListView;
    } else {
        appView = stationCreateView;
    }
    $('#container').append(appView.render().el);
});
