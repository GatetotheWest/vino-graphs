// import { Graph, ExcelDataTransformer } from './classes.js';
class Filter {

    // param: GraphData[], networkModel
    static FilterByNetworkModel(graphDataArr, value) {
        return graphDataArr.filter((data) => data.networkModel === value);
    }

    // param: GraphData[], ieType
    static FilterByIeType(graphDataArr, value) {
        return graphDataArr.filter((data) => data.ieType.includes(value));
    }

    // param: GraphData[], ieType
    static FilterByClientPlatforms(graphDataArr, platformsArr) {
        return graphDataArr.filter((data) => platformsArr.includes(data.platformName));
    }

    // param: GraphData[] (of one networkModel), key (throughput, latency, efficiency, value)
    static getKpiData(graphDataArr, key) {
        return graphDataArr.map((data) => {
            console.log(data);
            console.log(data[key]);
            return data[key];
        });
    }
}
class ExcelDataTransformer {

    static transform(csvdata) {
        const entries = csvdata.filter((entry) => {
            return !entry.includes('begin_rec') && !entry.includes('end_rec');
        });
        // do other purging and data massaging here
        console.log(entries);
        // else generate
        return entries.map((entry) => {
            return new GraphData(new ExcelData(entry));
        });
    }
}

class ExcelData {
    constructor(csvdataline) {
        if (!csvdataline) {
            return;
        }
        this.networkModel = csvdataline[0];
        this.release = csvdataline[1];
        this.ieType = csvdataline[2];
        this.platformName = csvdataline[3];
        this.throughputInt8 = csvdataline[4];
        this.throughputFP16 = csvdataline[5];
        this.throughputFP32 = csvdataline[6];
        this.value = csvdataline[7];
        this.efficiency = csvdataline[8];
        this.price = csvdataline[9];
        this.tdp = csvdataline[10];
        this.sockets = csvdataline[11];
        this.pricePerSocket = csvdataline[12];
        this.tdpPerSocket = csvdataline[13];
        this.latency = csvdataline[14];
    }
    networkModel = '';
    release = '';
    ieType = '';
    platformName = '';
    throughputInt8 = '';
    throughputFP16 = '';
    throughputFP32 = '';
    value = '';
    efficiency = '';
    price = '';
    tdp = '';
    sockets = '';
    pricePerSocket = '';
    tdpPerSocket = '';
    latency = '';
}


class GraphData {
    constructor(excelData) {
        if (!excelData) {
            return;
        }
        this.networkModel = excelData.networkModel;
        this.release = excelData.release;
        this.ieType = excelData.ieType;
        this.platformName = excelData.platformName;
        this.kpi = new KPI(
            new Precision(excelData.throughputInt8, excelData.throughputFP16, excelData.throughputFP32),
            excelData.value,
            excelData.efficiency,
            excelData.latency);
        this.price = excelData.price;
        this.tdp = excelData.tdp;
        this.sockets = excelData.sockets;
        this.pricePerSocket = excelData.pricePerSocket;
        this.tdpPerSocket = excelData.tdpPerSocket;
        this.latency = excelData.latency;
    }
    networkModel = '';
    platformName = '';
    release = '';
    ieType = '';
    kpi = new KPI();
    price = '';
    tdp = '';
    sockets = '';
    pricePerSocket = '';
    tdpPerSocket = '';
}

class KPI {
    constructor(precisions, value, efficiency, latency) {
        this.throughput = precisions;
        this.value = value;
        this.efficiency = efficiency;
        this.latency = latency;
    }
    throughput = new Precision();
    value = '';
    efficiency = '';
    latency = '';
}

class Precision {
    constructor(int8, fp16, fp32) {
        this.int8 = int8;
        this.fp16 = fp16;
        this.fp32 = fp32;
    }
    int8 = '';
    fp16 = '';
    fp32 = '';
}

class Graph {
    constructor(data) {
        this.data = data;
    }
    data = new GraphData();

    static getIeTypeText(ietype) {
        switch (ietype) {
            case 'core':
                return 'Client Platforms (Intel® Core™)';
            case 'xeon':
                return 'Server Platforms (Intel® Xeon®)';
            case 'atom':
                return 'Mobile Platforms (Intel® Atom™)';
            case 'accel':
                return 'Accelerator Platforms';
            default:
                return '';
        }
    }

    // functions to get unique keys 
    static getNetworkModels(graphDataArr) {
        return Array.from(new Set(graphDataArr.map((obj) => obj.networkModel)));
    }
    static getIeTypes(graphDataArr) {
        return Array.from(new Set(graphDataArr.map((obj) => obj.ieType)));
    }
    static getPlatforms(graphDataArr) {
        return Array.from(new Set(graphDataArr.map((obj) => obj.platformName)));
    }
    static getCoreTypes(graphDataArr) {
        return ['CPU', 'iGPU', 'CPU+iGPU'];
    }
    static getKpis(graphDataArr) {
        return ['Throughput', 'Value', 'Efficiency', 'Latency'];
    }
    // TODO: this is naive, will need to do an actual filter here potentially
    static getPrecisions(graphDataArr) {
        return ['INT8', 'FP16', 'FP32'];
    }

    // param: GraphData[]
    static getPlatformNames(graphDataArr) {
        return graphDataArr.map((data) => data.platformName);
    }

    // param: GraphData[]
    static getDatabyKPI(graphDataArr, kpi) {
        switch (kpi) {
            case 'throughput':
                return graphDataArr.map((data) => data.kpi.throughput);
            case 'latency':
                return graphDataArr.map((data) => data.kpi.latency);
            case 'efficiency':
                return graphDataArr.map((data) => data.kpi.efficiency);
            case 'value':
                return graphDataArr.map((data) => data.kpi.value);
            default:
                return [];
        }
    }

    // this returns an object that is used to ender the chart
    static getGraphConfig(kpi, precisions) {
        switch (kpi) {
            case 'throughput':
                return {
                    chartTitle: 'Throughput',
                    chartSubtitle: '(higher is better)',
                    iconClass: 'throughput-icon',
                    datasets: precisions.map((precision) => this.getPrecisionConfig(precision)),
                };
            case 'latency':
                return {
                    chartTitle: 'Latency',
                    chartSubtitle: '(lower is better)',
                    iconClass: 'latency-icon',
                    datasets: [{ data: null, color: '#8F5DA2', label: 'Milliseconds' }],
                };
            case 'value':
                return {
                    chartTitle: 'Value',
                    chartSubtitle: '(higher is better)',
                    iconClass: 'value-icon',
                    datasets: [{ data: null, color: '#8BAE46', label: 'FPS/$ (INT8)' }],
                };
            case 'efficiency':
                return {
                    chartTitle: 'Efficiency',
                    chartSubtitle: '(higher is better)',
                    iconClass: 'efficiency-icon',
                    datasets: [{ data: null, color: '#E96115', label: 'FPS/TDP (INT8)' }],
                };
            default:
                return {};
        }
    }

    static getPrecisionConfig(precision) {
        switch (precision) {
            case 'int8':
                return { data: null, color: '#00C7FD', label: 'FPS (INT8)' };
            case 'fp16':
                return { data: null, color: '#0068B5', label: 'FPS (FP16)' };
            case 'fp32':
                return { data: null, color: '#00C7FD', label: 'FPS (FP32)'};
            default:
                return {};
        }
    }

    static getGraphPlatformText(platform) {
        switch (platform) {
            case 'atom':
                return 'Mobile Platforms';
            case 'core':
                return 'Client Platforms';
            case 'xeon':
                return 'Server Platforms';
            case 'accel':
                return 'Accelerated Platforms';
            default:
                return '';
        }
    }
}

$(document).ready(function () {

    $('#build-graphs-btn').on('click', showModal);

    function clickBuildGraphs(graph, networkModels, ietype, platforms, kpis, precisions) {
        renderData(graph, networkModels, ietype, platforms, kpis, precisions);

        $('.edit-settings-btn').show();
        $('.clear-all-btn').hide();
        $('.modal-footer').show();
        $('.configure-graphs-header h3').addClass('header-inactive');
        $('.benchmark-graph-results-header h3').removeClass('header-inactive');

        $('.edit-settings-btn').on('click', (event) => {
            $('.configure-graphs-content').show();
            $('.edit-settings-btn').hide();
            $('.clear-all-btn').show();
            $('.modal-footer').hide();
            $('.configure-graphs-header h3').removeClass('header-inactive');
            $('.benchmark-graph-results-header h3').addClass('header-inactive');
            $('.chart-placeholder').empty();
        });

        $('.graph-chart-title-header').on('click', (event) => {
            var parent = event.target.parentElement;

            if ($(parent).children('.chart-wrap.container').is(":visible")) {
                $(parent).children('.chart-wrap.container').hide();
                $(parent).children('.chevron-right-btn').show();
                $(parent).children('.chevron-down-btn').hide();
                $
            } else {
                $(parent).children('.chart-wrap.container').show();
                $(parent).children('.chevron-down-btn').show();
                $(parent).children('.chevron-right-btn').hide();
            }
        });
    }

    function hideModal() {
        $('#graphModal').hide();
        document.body.style.overflow = 'auto';
    }

    function showModal() {
        document.body.style.overflow = 'hidden';
        if ($('#graphModal').length) {
            $('#graphModal').show();
            return;
        }
        const staticData = 'csv/testdatacsv.csv';
        Papa.parse(staticData, {
            download: true,
            complete: renderModal
        });
    }

    function renderModal(result) {
        console.log(result.data);
        // remove header from csv line
        result.data.shift();
        var graph = new Graph(ExcelDataTransformer.transform(result.data));

        var networkModels = Graph.getNetworkModels(graph.data);
        var ieTypes = Graph.getIeTypes(graph.data);
        var platforms = Graph.getPlatforms(graph.data);
        var coreTypes = Graph.getCoreTypes(graph.data);
        var kpis = Graph.getKpis(graph.data);
        var precisions = Graph.getPrecisions(graph.data);

        var selectedNetworkModels = [];
        // TODO: check this line for defaul value
        var selectedIeType = 'atom';
        var selectedClientPlatforms = [];
        var selectedKPIs = [];
        var selectedPrecisions = [];


        console.log(platforms);

        console.log(graph);

        fetch('_static/html/modal.html').then((response) => response.text()).then((text) => {

            // generate and configure modal container
            var modal = $('<div>');
            modal.attr('id', 'graphModal');
            modal.addClass('modal');
            // generate and configure modal content from html import
            var modalContent = $(text);
            modalContent.attr('id', 'graphModalContent');
            modalContent.addClass('modal-content');
            modal.append(modalContent);

            // hide edit settings button
            $('.edit-settings-btn').hide();

            const models = networkModels.map((networkModel) => createCheckMark(networkModel, 'networkmodel'));
            modal.find('.models-column-one').append(models.slice(0, models.length / 2));
            modal.find('.models-column-two').append(models.slice(models.length / 2));

            const types = ieTypes.map((ieType) => {
                var labelText = Graph.getIeTypeText(ieType);
                if (labelText) {
                    const item = $('<label class="checkmark-container">');
                    const checkboxSpan = $('<span class="checkmark radiobutton">');
                    item.text(Graph.getIeTypeText(ieType));
                    const radio = $('<input type="radio" name="ietype"/>');
                    item.append(radio);
                    item.append(checkboxSpan);
                    radio.attr('data-ietype', ieType);
                    return item;
                }
            });
            modal.find('.ietype-column').append(types);

            //TODO: check this line
            modal.find('.ietype-column input').first().attr('checked', true);

            const kpiLabels = kpis.map((kpi) => createCheckMark(kpi, 'kpi'));
            modal.find('.kpi-column').append(kpiLabels);

            // TODO: figure out what to do with precisions
            // const precisionLabels = precisions.map((precision) => {

            // });

            $('body').prepend(modal);

            $('.clear-all-btn').on('click', () => {
                $('.modal-content-grid-container input:checkbox').each((index, object) => $(object).prop('checked', false));
                selectedNetworkModels = [];
                selectedIeType = 'atom';
                selectedClientPlatforms = [];
                selectedKPIs = [];
                selectedPrecisions = [];
            })

            $('#modal-build-graphs-btn').on('click', () => {
                $('.configure-graphs-content').hide();
                clickBuildGraphs(graph, selectedNetworkModels, selectedIeType, selectedClientPlatforms, selectedKPIs, selectedPrecisions)
            });

            $('.modal-close').on('click', hideModal);
            $('.close-btn').on('click', hideModal);

            modal.find('.models-column-one input').on('click', function (event) {
                const selectedItem = $(this).data('networkmodel');
                if (event.target.checked) {
                    selectedNetworkModels.push(selectedItem)
                } else {
                    selectedNetworkModels = selectedNetworkModels.filter((item) => item !== selectedItem);
                }
                var fPlatforms = filterClientPlatforms(graph.data, selectedNetworkModels, selectedIeType);
                renderClientPlatforms(fPlatforms, modal);
                selectedClientPlatforms = Graph.getPlatformNames(fPlatforms);
            });
            modal.find('.models-column-two input').on('click', function (event) {
                const selectedItem = $(this).data('networkmodel');
                if (event.target.checked) {
                    selectedNetworkModels.push(selectedItem)
                } else {
                    selectedNetworkModels = selectedNetworkModels.filter((item) => item !== selectedItem);
                }
                var fPlatforms = filterClientPlatforms(graph.data, selectedNetworkModels, selectedIeType);
                renderClientPlatforms(fPlatforms, modal);
                selectedClientPlatforms = Graph.getPlatformNames(fPlatforms);
                console.log(selectedNetworkModels);
            });
            modal.find('.ietype-column input').on('click', function (event) {
                const selectedItem = $(this).data('ietype');
                selectedIeType = selectedItem;
                var fPlatforms = filterClientPlatforms(graph.data, selectedNetworkModels, selectedIeType);
                renderClientPlatforms(fPlatforms, modal);
                selectedClientPlatforms = Graph.getPlatformNames(fPlatforms);
                if (selectedIeType === 'core') {
                    showCoreSelectorTypes(coreTypes);
                }
                else {
                    hideCoreSelectorTypes();
                }
            });
            modal.find('.client-platform-column input').on('click', function (event) {
                const selectedItem = $(this).data('platform');
                if (event.target.checked) {
                    selectedClientPlatforms.push(selectedItem)
                } else {
                    selectedClientPlatforms = selectedClientPlatforms.filter((item) => item !== selectedItem);
                }
            });
            modal.find('.kpi-column input').on('click', function (event) {
                const selectedItem = $(this).data('kpi');
                console.log(event.target.checked);
                if (event.target.checked) {
                    selectedKPIs.push(selectedItem)
                } else {
                    selectedKPIs = selectedKPIs.filter((item) => item !== selectedItem);
                }
                if (selectedKPIs.includes('Throughput')) {
                    showPrecisionSelectorTypes(precisions);
                }
                else {
                    hidePrecisionSelectorTypes();
                }
            });

            // TODO Fix this targeting issue
            window.onclick = function (event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }
        });
    }

    function showCoreSelectorTypes(coreTypes) {
        if ($('.client-platform-column').find('.selectable-box-container').length) {
            $('.client-platform-column').find('.selectable-box-container').show();
            return;
        }
        var container = $('<div>');
        container.addClass('selectable-box-container');
        coreTypes.forEach((type) => {
            var box = $('<div>' + type + '</div>');
            box.attr('data-coretype', type);
            box.addClass('selectable-box');
            container.append(box);
        });
        $('.client-platform-column').prepend(container);
        $('.client-platform-column .selectable-box').on('click', function() {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
            } else {
                $(this).addClass('selected');
            }
        });
    }

    function hideCoreSelectorTypes() {
        $('.client-platform-column').find('.selectable-box-container').hide();
    }

    function showPrecisionSelectorTypes(precisions) {

        if ($('.precisions-column').find('.selectable-box-container').length) {
            $('.precisions-column').find('.selectable-box-container').show();
            return;
        }
        var container = $('<div>');
        container.addClass('selectable-box-container');
        precisions.forEach((prec) => {
            var box = $('<div>' + prec + '</div>');
            box.attr('data-precision', prec);
            box.addClass('selectable-box');
            container.append(box);

        });
        $('.precisions-column').prepend(container);
        $('.precisions-column .selectable-box').on('click', function() {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
            } else {
                $(this).addClass('selected');
            }
        });
    }

    function hidePrecisionSelectorTypes() {
        $('.precisions-column').find('.selectable-box-container').hide();
    }

    // TODO: matrix math or truth table testing before shipping this
    function filterClientPlatforms(data, networkModels, ietype) {
        var first = Filter.FilterByNetworkModel(data, networkModels[0]);
        var second = Filter.FilterByIeType(first, ietype);
        return second;
    }

    function renderClientPlatforms(platforms, modal) {
        var platformNames = Graph.getPlatformNames(platforms);
        $('.client-platform-column').empty();
        const clientPlatforms = platformNames.map((platform) => createCheckMark(platform, 'platform'));
        selectAllCheckboxes(clientPlatforms);
        modal.find('.client-platform-column').append(clientPlatforms);
    }

    function createCheckMark(itemLabel, modelLabel) {
        const item = $('<label class="checkmark-container">');
        item.text(itemLabel);
        const checkbox = $('<input type="checkbox"/>');
        const checkboxSpan = $('<span class="checkmark">');
        item.append(checkbox);
        item.append(checkboxSpan);
        checkbox.attr('data-' + modelLabel, itemLabel);
        return item;
    }

    // receives a jquery list of items and selects all input checkboxes
    function selectAllCheckboxes(items) {
        items.forEach((item) => {
            item.find(':input').attr('checked', true);
        });
    }

    function getChartOptions(title) {
        return {
            responsive: false,
            maintainAspectRatio: false,
            legend: { display: true, position: 'bottom' },
            title: {
                display: false,
                text: title
            },
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],
                yAxes: [{
                    ticks: {
                        display: false, //this will remove only the label
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                datalabels: {
                    color: "#4A4A4A",
                    anchor: "end",
                    align: "end",
                    clamp: false,
                    offset: 0,
                    display: true,
                    font: {
                        size: 8,
                        family: 'Roboto'
                    }
                }
            }
        }
    }

    // params: string[], Datasets[]
    function getChartDataNew(labels, datasets) {
        return {
            labels: labels,
            datasets: datasets.map((item) => {
                return {
                    label: item.label,
                    data: item.data,
                    backgroundColor: item.color,
                    borderColor: 'rgba(170,170,170,0)',
                    barThickness: 12
                }
            })
        }
    }

    function renderData(graph, networkModels, ietype, platforms, kpis, precisions) {

        $('.chart-placeholder').empty();
        networkModels.forEach((networkModel) => {
            // graph title
            var chartName = networkModel;
            var chartSlug = chartName.replace(')', '').replace(' (', '-');
            console.log(chartSlug);
            var chartContainer = $('<div>');
            // apply graph title temporary readdress

            var chevronDown = '<span class="chevron-down-btn"></span>';
            var chevronRight = '<span style="display:none" class="chevron-right-btn"></span>';
            $(chevronRight).hide();
            var chartContainerHeader = $('<span class="graph-chart-title">' + networkModel + '</span>' + chevronDown + chevronRight);
            chartContainerHeader.addClass('graph-chart-title-header');
            chartContainer.prepend(chartContainerHeader);
            chartContainer.attr('id', 'ov-chart-container-' + chartSlug);

            chartContainer.addClass('chart-container');
            chartContainer.addClass('container');

            // Array of Arrays
            var filteredNetworkModels = Filter.FilterByNetworkModel(graph.data, networkModel);
            var filteredIeTypes = Filter.FilterByIeType(filteredNetworkModels, ietype);
            var filteredGraphData = Filter.FilterByClientPlatforms(filteredIeTypes, platforms);
            console.log(platforms);
            console.log(filteredGraphData);

            $('.chart-placeholder').append(chartContainer);
            if (filteredGraphData.length > 0) {
                createChartWithNewData(filteredGraphData, chartContainer, kpis, ietype, precisions);
            }

        })
    };


    // this function should take the final data set and turn it into graphs
    // params: GraphData, unused, chartContainer
    function createChartWithNewData(model, chartContainer, kpis, ietype, precisions) {
        var chartWrap = $('<div>');
        chartWrap.addClass('chart-wrap');
        chartWrap.addClass('container');
        chartContainer.append(chartWrap);
        var labels = Graph.getPlatformNames(model);
        console.log('LABELS');
        console.log(model);

        var graphConfigs = kpis.map((str) => {
            var kpi = str.toLowerCase();
            if (kpi === 'throughput') {
                var throughputData = Graph.getDatabyKPI(model, kpi);
                var config = Graph.getGraphConfig(kpi, precisions);
                precisions.forEach((prec, index) => {
                    config.datasets[index].data = throughputData.map(tData => tData[prec]);
                });
                return config;
            }
            var config = Graph.getGraphConfig(kpi);
            config.datasets[0].data = Graph.getDatabyKPI(model, kpi);
            return config;
        });


        // get the kpi title's and create headers for the graphs 
        var chartColumnHeaderContainer = $('<div>');
        chartColumnHeaderContainer.addClass('chart-column-header-container');
        chartColumnHeaderContainer.append($('<div class="chart-column-title"></div>'));
        graphConfigs.forEach((graphConfig) => {
            var columnHeaderContainer = $('<div>');
            columnHeaderContainer.addClass('chart-column-title');
            var columnIcon = $('<div class="icon">');
            columnIcon.addClass(graphConfig.iconClass);
            columnHeaderContainer.append(columnIcon);
            var columnHeader = $('<div class="chart-header">');
            columnHeader.append($('<div class="title">' + graphConfig.chartTitle + '</div>'));
            columnHeader.append($('<div class="title">' + Graph.getGraphPlatformText(ietype) + '</div>'));
            columnHeader.append($('<div class="subtitle">' + graphConfig.chartSubtitle + '</div>'));
            columnHeaderContainer.append(columnHeader);
            chartColumnHeaderContainer.append(columnHeaderContainer);
        });

        console.log(graphConfigs);

        // get the client platform labels and create labels for all the graphs

        var labelsContainer = $('<div>');
        labelsContainer.addClass('chart-labels-container');

        labels.forEach((label) => {
            labelsContainer.append($('<div class="title">' + label + '</div>'));
        });

        console.log(labels);

        // get the legend and create legends for each graph

        var graphClass = $('<div>');
        graphClass.addClass('graph-row');
        chartWrap.append(chartColumnHeaderContainer);
        graphClass.append(labelsContainer);
        chartWrap.append(graphClass);

        graphConfigs.forEach((graphConfig, index) => {
            // TODO: Clean this up
            switch (index) {
                case 0:
                    processMetricNew(labels, graphConfig.datasets, graphConfig.chartTitle, graphClass, 'graph-row-column');
                    break;
                case 1:
                    processMetricNew(labels, graphConfig.datasets, graphConfig.chartTitle, graphClass, 'graph-row-column');
                    break;
                case 2:
                    processMetricNew(labels, graphConfig.datasets, graphConfig.chartTitle, graphClass, 'graph-row-column');
                    break;
                case 3:
                    processMetricNew(labels, graphConfig.datasets, graphConfig.chartTitle, graphClass, 'graph-row-column');
                    break;
                default:
                    break;
            }
        });

        // might need this line for multiple graphs on a page
        // var displayWidth = $(window).width();

    }

    function processMetricNew(labels, datasets, chartTitle, container, widthClass, displayLabels) {
        var chart = $('<div>');
        chart.addClass('chart');
        chart.addClass(widthClass);
        chart.height(labels.length * 55 + 30);
        var canvas = $('<canvas>');
        chart.append(canvas);
        container.append(chart);
        var context = canvas.get(0).getContext('2d');
        context.canvas.height = labels.length * 55 + 30;
        new Chart(context, {
            type: 'horizontalBar',
            data: getChartDataNew(labels, datasets),
            options: getChartOptions(chartTitle, displayLabels)
        });
    }

});
