"use strict";

var GH = window.GH;
var AJS = window.AJS;
var _ = window._;

var SCRUMIFY = {};

SCRUMIFY.swimlaneHasRendered = function(callback) {
    var timer = setInterval(function() {
        var element = document.querySelector(".ghx-swimlane-header");

        if (element) {
            clearInterval(timer);
            if (typeof callback === "function") {
                callback();
            }
        }
    }, 100);
};





// reassign function to compute columns width
GH.WorkDragAndDrop.positionDropZoneOverlay = function() {
    var overlay = AJS.jquery(".ghx-zone-overlay");
    var columns = overlay.prev(".ghx-columns");
    var columnsHeight = columns.height();

    overlay.css({
        height: columnsHeight
    });

    // get columns from overlay
    var overlayColumns = AJS.jquery(".ghx-zone-overlay-column", overlay);
    // get columns from swimlane
    var swimlaneColumns = AJS.jquery(".ghx-column", columns);

    for (var i = 0; i < swimlaneColumns.length; i++) {
        AJS.jquery(overlayColumns[i]).css({
            width: swimlaneColumns[i].clientWidth
        });
    }

};

// reassign function to add upperguard and lowerguard
GH.BurndownChartModel.calculateSeries = function() {
    var c = GH.BurndownChartModel.timelineData;
    var g = c.timeline;
    if (_.isEmpty(g)) {
        return;
    }
    var b = g[0];
    var d = [];

    d.push(GH.BurndownChartModel.calculateGuidelineSeries({
        id: "guideline",
        label: "Guideline",
        guardFactor: 1,
        color: "rgba(0,0,0,.2)",
        startTime: c.startTime,
        startValue: b.values.estimate,
        endTime: c.endTime
    }));
    d.push(GH.BurndownChartModel.calculateGuidelineSeries({
        id: "upperguard",
        label: "Upper guard",
        guardFactor: 1.2,
        color: "rgba(14, 188, 174, 0.25)",
        startTime: c.startTime,
        startValue: b.values.estimate,
        endTime: c.endTime
    }));
    d.push(GH.BurndownChartModel.calculateGuidelineSeries({
        id: "lowerguard",
        label: "Lower guard",
        guardFactor: 0.8,
        color: "rgba(14, 188, 174, 0.25)",
        startTime: c.startTime,
        startValue: b.values.estimate,
        endTime: c.endTime
    }));

    var h = ["estimate"];
    if (GH.BurndownChartModel.isTimeTracking()) {
        h.push("timeSpent");
    }
    var j = {};
    var a = {};
    _.each(h, function(k) {
        j[k] = [];
        a[k] = [];
    });
    _.each(g, function(k) {
        if (!k.openCloseEntries) {
            _.each(h, function(l) {
                if (k.deltas && _.isNumber(k.deltas[l]) && k.deltas[l] !== 0) {
                    j[l].push([k.time, k.values[l] - k.deltas[l]]);
                    a[l].push({});
                }
                j[l].push([k.time, k.values[l]]);
                a[l].push(k);
            });
        }
    });
    if (!c.completeTime) {
        var e = _.last(g);
        _.each(h, function(k) {
            j[k].push([Math.max(c.startTime, c.now), e.values[k]]);
        });
    }
    if (GH.BurndownChartModel.isTimeTracking()) {
        d.push({
            id: "timeSpent",
            data: j.timeSpent,
            color: "#14892c",
            label: "Time Spent"
        });
    }
    d.push({
        id: "estimate",
        data: j.estimate,
        color: "#d04437",
        label: "Remaining Values"
    });
    var i;
    if (GH.BurndownChartView.wallboardMode) {
        i = GH.ChartColors.nonWorkingDaysWallboard;
    } else {
        i = GH.ChartColors.nonWorkingDays;
    }
    d.push({
        id: "markings",
        color: i,
        data: [],
        label: "Non-Working Days"
    });
    var f = 0;
    _.each(h, function(k) {
        f = Math.max(f, c.maxValues[k] || 0);
    });
    GH.BurndownChartModel.calculateYAxis(f);
    GH.BurndownChartModel.series = d;
    GH.BurndownChartModel.seriesData = a;
};

// reassign function to be able to compute upperguard and lowerguard
GH.BurndownChartModel.calculateGuidelineSeries = function(params) {
    var startValue = params.startValue;
    var rateDefinitions = GH.BurndownRate.getRateDefinitions();
    var timeRange = GH.BurndownRate.limitToTimeRange(rateDefinitions, params.startTime, params.endTime);
    var timePerUnit = GH.BurndownChartModel.calculateTimePerUnit(timeRange, startValue);

    var data = [
        [ params.startTime, params.startValue * params.guardFactor ]
    ].concat(_.map(timeRange, function(range) {
        if (range.rate === GH.BurndownRate.WORKING_DAY) {
            var h = range.start - range.end;
            var g = h / timePerUnit;
            startValue -= g;
        }

        return [_.min([ range.end, params.endTime ]), _.max([ startValue * params.guardFactor, 0 ])];
    }));

    data = _.reject(data, function(dataItem) {
        return dataItem.length === 0;
    });

    return {
        id: params.id,
        data: data,
        color: params.color,
        label: params.label
    };
};

// fix: swimlanes for other sprint showing up on rapdiboard
GH.GridDataModel.prototype.getSwimlaneIssueCount = function(t) {
    return this.cache.bySwimlaneThenColumn[t].reduce(function(a, b) {
        return a.concat(b);
    }, []).length;
};






// GH.CFDController
// GH.CFD.Data
// GH.CFDView
// reassign function to be able to compute upperguard and lowerguard
GH.CFD.Data.computeSeries = function (n, u) {
    var seriesData = [],
        points = n.columnChanges,
        columns = n.columns;
    
    _.each(columns, function (column) {
        column.issueCount = 0; 
        column.data = []
    });

    var burnupData = [];
    _.each(points, function (point, pointIndex) {
        pointIndex = parseInt(pointIndex, 10);
        _.each(point, function (elementOfColumnChange) {
            _.each(columns, function (column, columnIndex) {
                if (elementOfColumnChange.columnFrom == columnIndex) column.issueCount--;
                if (elementOfColumnChange.columnTo == columnIndex) column.issueCount++;
                column.data.push([pointIndex, column.issueCount])
            })
        })
        //burnupData.push([pointIndex, pointIndex]);
    });
    

    var line_options = {
        show: true,
        lineWidth: 2,
        fill: false,
        fillColor: {
            colors: [{
                opacity: 0.0
            }, {
                opacity: 0.7
            }]
        }
    };
    var bar_options = {
        show: true,
        align: 'center',
        lineWidth: 0,
        fill: true,
        barWidth: 0.6
    };
    for (var c = columns.length - 1; c >= 0; c--) {
        var column = columns[c],
            columnData = column.data;
        if (columnData.length > 0 && columnData[columnData.length - 1][0] < u) 
            columnData.push([u, columnData[columnData.length - 1][1]]);
        seriesData.push({data: columnData, label: AJS.escapeHtml(String(column.name)), columnIndex: c, stack: true, bars: bar_options});
    }
    var length = columns[0].data.length;
    for (var i = 0; i < length; i++)
    {
        burnupData.push([columns[0].data[i][0], i]);
    }
    seriesData.push({data: burnupData, label: "Burnup", columnIndex: columns.length, stack: false, lines: line_options});
    return seriesData;
}

var getColors = function (columns, activeColumns) {
    var COLUMN_COLORS = ["#FF800D", "#23819C", "#9669FE", "#59955C", "#B9264F", "#B05F3C", "#2966B8", "#9A03FE", "#FF2626", "#FF5353", "#C8B400", "#79FC4E", "#8C8CFF", "#C48484", "#4FBDDD", "#FFBE28", "#99C7FF", "#AE70ED", "#FFA8A8", "#DAAF85"];
    var colors = [];
    _.each(columns, function (column, columnIndex) {
        var isAnyActive = _.any(activeColumns, function (activeColumn) {
            return activeColumn.id == column.id
        });
        if (isAnyActive) colors.push(COLUMN_COLORS.slice(columnIndex))
    });
    colors.reverse();
    return colors;
}

var view = GH.CFDView;
view.renderChart = function (e) {
    var chart = require("jira-agile/rapid/ui/chart/chart");
    var controller = require("jira-agile/rapid/ui/chart/cfd-controller");
    var data = require("jira-agile/rapid/ui/chart/cfd-data");
    var jquery = require("jquery");
    var _ = require("underscore");
    var chart = require("jira-agile/rapid/ui/chart/chart");
    var chartView = require("jira-agile/rapid/ui/chart/chart-view");
    var globalEvents = require("jira-agile/rapid/global-events");
    var chartFilters = GH.ChartFilters,
        chartTimeFrames = GH.ChartTimeFrames,
        timeFormat = GH.TimeFormat,
        flotChartUtils = GH.FlotChartUtils,
        tpl = GH.tpl;
    
    chart.destroy(controller.id + "Overview");
    chart.destroy(controller.id);
    var startDate = chartTimeFrames.getChartStartDate(),
        endDate = chartTimeFrames.getChartEndDate(),
        series = data.computeSeries(e, e.now),
        colors = getColors(chartFilters.getColumns(), chartFilters.getActiveColumns()),
        mainChartOptions = {
            colors: colors,
            xaxis: {mode: "time", min: startDate, max: endDate},
            yaxis: {tickDecimals: 0, minTickSize: 1, min: 0, tickLength: "full"},
            series: {lines: {show: true, fill: 1, lineWidth: 1}},
            grid: {hoverable: true, clickable: true, autoHighlight: false},
            mouseEnterExitEvents: true,
            selection: {mode: "x"},
            legend: {container: null, backgroundOpacity: .5, position: "nw"}
        },
        overviewOptions = {
            colors: colors,
            xaxis: {mode: "time"},
            yaxis: {show: false},
            series: {stack: true, lines: {show: true, fill: 1, lineWidth: 1}},
            selection: {mode: "x"},
            legend: {show: false}
        };
    chartView.hideChartStatus();
    chartView.showChartGroup(); 
    flotChartUtils.setAndAlignAxisLabels("Time", "Number of Issues");
    
    var chartContainer = chartView.getChartView(true),
        chartOverviewGroupElement = jquery("#ghx-chart-overview-group"),
        chartOverviewElement = jquery("#ghx-chart-overview"),
        chartOverviewGroupH4Element = jquery(chartOverviewGroupElement).find("h4"),
        chartOverviewGroupDescriptionElement = jquery(chartOverviewGroupElement).find(".ghx-description");
    
    jquery(chartOverviewGroupH4Element).text("Overview");
    jquery(chartOverviewGroupDescriptionElement).text("Click and drag cursor across chart or chart overview to select date range (double-click overview to reset).");
    chartOverviewGroupH4Element.show(); 
    chartOverviewGroupDescriptionElement.show(); 
    chartContainer.show();
    chartOverviewGroupElement.show();
    
    var viewContext = {chartContainer: chartContainer, series: series, options: mainChartOptions, realPoints: [], showPoints: false};
    chartContainer.unbind("plothover plotselected"); 
    chartContainer.bind("plotselected", view.handleSelection);
    chartContainer.bind("plothover", view.handlePlotHover);
    viewContext.mainChart = chart.draw(controller.id, chartContainer, series, mainChartOptions), 
        chartContainer.unbind("flotMouseEnter flotMouseLeave").bind("flotMouseEnter", view.handleMouseEnter).bind("flotMouseLeave", view.handleMouseLeave), 
        viewContext.mainChart.hooks.drawSeries.push(view.gatherPoints), 
        viewContext.mainChart.hooks.draw.push(view.deferredRenderPoints), 
        view._reverseLegendTable(), 
        chartOverviewElement.unbind("plotselected dblclick"), 
        chartOverviewElement.bind("plotselected", view.handleSelection), 
        chartOverviewElement.bind("dblclick", view.resetSelection);
    
    viewContext.overviewChart = chart.draw(controller.id + "Overview", chartOverviewElement, series, overviewOptions), 
    viewContext.overviewChart.setSelection({xaxis: { from: startDate, to: endDate }}, true)
    GH.CFDView.context = viewContext;
}