var Chart = Backbone.View.extend({
    initialize: function(args) {
        this.workspace = args.workspace;
        
        // Create a unique ID for use as the CSS selector
        this.id = _.uniqueId("chart_");
        $(this.el).attr({ id: this.id });
        
        // Bind table rendering to query result event
        _.bindAll(this, "render", "receive_data", "process_data", "show");
        this.workspace.bind('query:result', this.receive_data);
        
        // Add chart button
        this.add_button();
        this.workspace.toolbar.chart = this.show;
        if (! this.workspace.query) {
            this.workspace.bind('query:new', this.activate_button);
        } else {
            this.activate_button({ workspace: this });
        }
        
        // Append chart to workspace
        $(this.workspace.el).find('.workspace_results')
            .prepend($(this.el).hide());
    },
    
    add_button: function() {
        var $chart_button = 
            $('<a href="#chart" class="chart button disabled_toolbar"></a>')
            .css({ 'background': 
                "url('/js/saiku/plugins/Chart/chart.png') 50% 50% no-repeat" });
        var $chart_li = $('<li class="seperator"></li>').append($chart_button);
        $(this.workspace.toolbar.el).find("ul").append($chart_li);
    },
    
    activate_button: function(args) {
        $(args.workspace.el).find('.chart').removeClass('disabled_toolbar');
    },
    
    show: function(event, ui) {
        $(this.workspace.el).find('.workspace_results table').toggle();
        $(this.el).toggle();
        $(event.target).toggleClass('on');
        
        if ($(event.target).hasClass('on')) {
            this.render();
        }
    },
    
    render: function() { 
        this.chart = new pvc.BarChart({
            canvas: this.id,
            width: $(this.workspace.el).find('.workspace_results').width() - 10,
            height: $(this.workspace.el).find('.workspace_results').height() - 10,
            orientation: 'vertical',
            stacked: true,
            animate: true,
            legend: true,
            legendPosition:"bottom",
            colors: ["#A85A58", "#A88A58", "#3E536F", "#458449", "#D39E9C", "#D3BF9C", "#8B9DB7", "#8FC292"]
        });
        
        this.chart.setData(this.data, {
            crosstabMode: true,
            seriesInRows: false
        });
        
        this.chart.render();
    },
    
    receive_data: function(args) {
        return _.delay(this.process_data, 0, args);
    },
    
    process_data: function(args) {
        this.data = {};
        this.data.resultset = [];
        this.data.metadata = [];
        
        if (args.data.length > 0) {
        
            for (var field = 0; field < args.data[0].length; field++) {
                this.data.metadata.push({
                    colIndex: field,
                    colType: isNaN(args.data[1][field].value.replace(/[^a-zA-Z 0-9.]+/g,'')) ? "String" : "Numeric",
                    colName: args.data[0][field].value
                });
            }
        
            for (var row = 1; row < args.data.length; row++) {
                var record = [];
                for (var col = 0; col < args.data[row].length; col++) {
                    record.push(
                        parseFloat(args.data[row][col].value.replace(/[^a-zA-Z 0-9.]+/g,'')) ?
                        parseFloat(args.data[row][col].value.replace(/[^a-zA-Z 0-9.]+/g,'')) :
                        args.data[row][col].value
                    );
                }
                this.data.resultset.push(record);
            }
        }
    }
});

(function() {
    // Initialize YUI
    $.getScript("js/saiku/plugins/Chart/ccc.js", function() {
        function new_workspace(args) {
            // Add chart element
            args.workspace.chart = new Chart({ workspace: args.workspace });
        }
        
        // Attach chart to existing tabs
        for (var i = 0; i < Saiku.tabs._tabs.length; i++) {
            new_workspace({ workspace: Saiku.tabs._tabs[i].content });
        }
        
        // Attach chart to future tabs
        Saiku.session.bind("workspace:new", new_workspace);
    });
}());