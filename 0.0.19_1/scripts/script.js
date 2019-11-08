"use strict";
console.log("starting scrumify");

var GH = window.GH;
var AJS = window.AJS;
var _ = window._;

// GH.CFDController
// GH.CFD.Data
// GH.CFDView
// reassign function to be able to compute upperguard and lowerguard
var computeSeries = function(n, e_now, startDate, endDate) {
    var seriesData = [],
        points = n.columnChanges,
        columns = n.columns;

    _.each(columns, function(column) {
        column.issueCount = 0;
        column.data = []
    });

    var maxIssueCount = 0;
    var burnupData = [];
    _.each(points, function(point, pointDate) {
        pointDate = parseInt(pointDate, 10);
        _.each(point, function(elementOfColumnChange) {
            _.each(columns, function(column, columnIndex) {
                if (elementOfColumnChange.columnFrom == columnIndex) column.issueCount--;
                if (elementOfColumnChange.columnTo == columnIndex) column.issueCount++;
                column.data.push([pointDate, column.issueCount]);
                if (pointDate >= startDate && pointDate < endDate) {
                    var curIssueCount = 0;
                    _.each(columns, function(col2) {
                        curIssueCount += col2.issueCount;
                    })
                    if (curIssueCount > maxIssueCount) {
                        maxIssueCount = curIssueCount;
                    }
                }
            })
        })
    });


    var line_options = {
        show: true,
        lineWidth: 2,
        fill: false,
        fillColor: {
            colors: [{
                opacity: 0.0,
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
        if (columnData.length > 0 && columnData[columnData.length - 1][0] < e_now)
            columnData.push([e_now, columnData[columnData.length - 1][1]]);
        seriesData.push({ data: columnData, label: AJS.escapeHtml(String(column.name)), columnIndex: c, stack: true, bars: bar_options });
    }

    const ONE_DAY = 1000 * 3600 * 24;
    var dateDiff = endDate - startDate;
    var numDays = Math.floor(dateDiff / ONE_DAY);

    var date = new Date(startDate);
    var dow = date.getDay(); // Sunday - Saturday : 0 - 6
    var daysUntilWeekend = 6 - dow;
    var numWorkindDays = 0;
    burnupData.push([startDate, 0]);
    if (numDays > daysUntilWeekend) {
        numWorkindDays += daysUntilWeekend;
        burnupData.push([startDate + ONE_DAY * daysUntilWeekend, daysUntilWeekend]);
        var numFullWeeks = Math.floor((numDays - daysUntilWeekend) / 7);
        for (var week = 0; week < numFullWeeks; week++) {
            numWorkindDays += 5;
            var firstWorkingDayOfWeek = daysUntilWeekend + 2 + week * 7;
            var lastWorkingDayOfWeek = firstWorkingDayOfWeek + 5;
            burnupData.push([startDate + ONE_DAY * firstWorkingDayOfWeek, firstWorkingDayOfWeek - 2 * (week + 1)]);
            burnupData.push([startDate + ONE_DAY * lastWorkingDayOfWeek, lastWorkingDayOfWeek - 2 * (week + 1)]);
        }
        var finalWeekStartDay = numFullWeeks * 7 + daysUntilWeekend + 2;
        if (finalWeekStartDay < numDays) {
            burnupData.push([startDate + ONE_DAY * finalWeekStartDay, finalWeekStartDay - 2 * (numFullWeeks + 1)]);
            numWorkindDays += numDays - finalWeekStartDay;
        }
    } else {
        numWorkindDays = numDays;
    }

    var numPointsPerDay = numWorkindDays == 0 ? 0 : maxIssueCount / numWorkindDays;
    for (var i = 0; i < burnupData.length; i++) {
        burnupData[i][1] *= numPointsPerDay;
        console.log(new Date(burnupData[i][0]) + ": " + burnupData[i][1]);
    }
    burnupData.push([endDate, maxIssueCount]);
    console.log(new Date(endDate) + ": " + maxIssueCount);

    seriesData.push({ data: burnupData, label: "Burnup", columnIndex: columns.length, stack: false, lines: line_options });
    return seriesData;
}

var getColors = function(columns, activeColumns) {
    var COLUMN_COLORS = ["#FF800D", "#23819C", "#9669FE", "#59955C", "#B9264F", "#B05F3C", "#2966B8", "#9A03FE", "#FF2626", "#FF5353", "#C8B400", "#79FC4E", "#8C8CFF", "#C48484", "#4FBDDD", "#FFBE28", "#99C7FF", "#AE70ED", "#FFA8A8", "#DAAF85"];
    var colors = [];
    _.each(columns, function(column, columnIndex) {
        var isAnyActive = _.any(activeColumns, function(activeColumn) {
            return activeColumn.id == column.id
        });
        if (isAnyActive) colors.push(COLUMN_COLORS.slice(columnIndex))
    });
    colors.reverse();
    colors.push("#000000");
    return colors;
}

var view = GH.CFDView;
view.renderChart = function(e) {
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
        series = computeSeries(e, e.now, startDate, endDate),
        colors = getColors(chartFilters.getColumns(), chartFilters.getActiveColumns()),
        mainChartOptions = {
            colors: colors,
            xaxis: { mode: "time", min: startDate, max: endDate },
            yaxis: { tickDecimals: 0, minTickSize: 1, min: 0, tickLength: "full" },
            series: { stack: true, lines: { show: true, fill: 1, lineWidth: 1 } },
            grid: { hoverable: true, clickable: true, autoHighlight: false },
            mouseEnterExitEvents: true,
            selection: { mode: "x" },
            legend: { container: null, backgroundOpacity: .5, position: "nw" }
        },
        overviewOptions = {
            colors: colors,
            xaxis: { mode: "time" },
            yaxis: { show: false },
            series: { stack: true, lines: { show: true, fill: 1, lineWidth: 1 } },
            selection: { mode: "x" },
            legend: { show: false }
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

    var viewContext = { chartContainer: chartContainer, series: series, options: mainChartOptions, realPoints: [], showPoints: false };
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
        viewContext.overviewChart.setSelection({ xaxis: { from: startDate, to: endDate } }, true)
    GH.CFDView.context = viewContext;
}

console.log("completed scrumify startup");
GH.CFDController.show();