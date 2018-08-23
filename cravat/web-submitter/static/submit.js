console.log('submit.js');

var GLOBALS = {
    jobs: [],
    annotators: {},
    reports: {}
}

const submit = () => {
    console.log('submit the form');
    let fd = new FormData();
    const textInputElem = $('#input-text');
    const textVal = textInputElem.val();
    let inputFile;
    if (textVal.length > 0) {
        const textBlob = new Blob([textVal], {type:'text/plain'})
        inputFile = new File([textBlob], 'raw-input.txt');
    } else {
        const fileInputElem = $('#input-file')[0];
        inputFile = fileInputElem.files[0];
    }
    fd.append('file', inputFile);
    var submitOpts = {
        annotators: [],
        reports: []
    }
    const annotChecks = $('#annotator-select-div')
                        .find('.checkbox-group-check');
    for (var i = 0; i<annotChecks.length; i++){
        const cb = annotChecks[i];
        if (cb.checked) {
            submitOpts.annotators.push(cb.value);
        }
    }
    const reportChecks = $('#report-select-div')
                         .find('.checkbox-group-check');
    for (var i = 0; i<reportChecks.length; i++){
        const cb = reportChecks[i];
        if (cb.checked) {
            submitOpts.reports.push(cb.value);
        }
    }
    submitOpts.assembly = $('#assembly-select').val();
    fd.append('options',JSON.stringify(submitOpts));
    $.ajax({
        url:'/rest/submit',
        data: fd,
        type: 'POST',
        processData: false,
        contentType: false,
        success: function (data) {
            addJob(data);
            buildJobsTable();
        }
    })
};

const addJob = jsonObj => {
    const trueDate = new Date(jsonObj.submission_time);
    jsonObj.submission_time = trueDate;
    GLOBALS.jobs.push(jsonObj);
    GLOBALS.jobs.sort((a, b) => {
        return b.submission_time.getTime() - a.submission_time.getTime();
    })

}

const buildJobsTable = () => {
    const allJobs = GLOBALS.jobs;
    $('.job-table-row').remove();
    const jobsTable = $('#jobs-table');
    for (let i = 0; i < allJobs.length; i++) {
        job = allJobs[i];
        const jobTr = $(getEl('tr'));
        jobTr.addClass('job-table-row');
        jobsTable.append(jobTr);
        // View
        const viewTd = $(getEl('td'));
        jobTr.append(viewTd);
        const viewBtn = $(getEl('button')).append('View');
        viewTd.append(viewBtn);
        viewBtn.attr('disabled', !job.viewable);
        viewBtn.attr('jobId', job.id);
        viewBtn.click(jobViewButtonHandler);
        // Input file
        jobTr.append($(getEl('td')).append(job.orig_input_fname));
        // Submission time
        jobTr.append($(getEl('td')).append(job.submission_time.toLocaleString()));
        // Job ID
        jobTr.append($(getEl('td')).append(job.id));
        // Database
        const dbTd = $(getEl('td'));
        jobTr.append(dbTd);
        const dbButton = $(getEl('button'));
        dbTd.append(dbButton);
        dbButton.append('Download');
        dbButton.attr('jobId',job.id);
        dbButton.click(jobDbDownloadButtonHandler);
        // Reports
        const reportTd = $(getEl('td'));
        jobTr.append(reportTd);
        const reportSelector = $(getEl('select'));
        reportSelector.attr('jobId',job.id);
        reportTd.append(reportSelector);
        for (let i=0; i<GLOBALS.reports.valid; i++) {
            let reportType = GLOBALS.reports.valid[i];
            let typeOpt = $(getEl('option'));
            reportSelector.append(typeOpt);
            typeOpt.attr('value', reportType);
            typeOpt.append(reportType[0].toUpperCase()+reportType.slice(1));
        }
        // Delete
        const deleteTd = $(getEl('td'));
        jobTr.append(deleteTd);
        const deleteBtn = $(getEl('button')).append('Delete');
        deleteTd.append(deleteBtn);
        deleteBtn.attr('jobId', job.id);
        deleteBtn.click(jobDeleteButtonHandler);
    }
}

const jobDbDownloadButtonHandler = (event) => {
    downloadJobDb($(event.target).attr('jobId'));
}

const downloadJobDb = (jobId) => {
    url = 'http://'+window.location.host+'/rest/jobs/'+jobId+'/db',
    downloadFile(url);
}

const downloadFile = (url) => {
    $('#download-area').attr('src', url);
}

const getEl = (tag) => {
    return document.createElement(tag);
}

const jobViewButtonHandler = (event) => {
    const jobId = $(event.target).attr('jobId');
    viewJob(jobId);
}

const viewJob = (jobId) => {
    $.ajax({
        url:'/rest/jobs/'+jobId,
        type: 'GET',
        processData: false,
        contentType: 'application/json',
        success: function (data) {
            console.log(data);
        }
    })
}

const jobDeleteButtonHandler = (event) => {
    const jobId = $(event.target).attr('jobId');
    deleteJob(jobId);
}

const deleteJob = (jobId) => {
    $.ajax({
        url:'/rest/jobs/'+jobId,
        type: 'DELETE',
        processData: false,
        contentType: 'application/json',
        success: function (data) {
            console.log(data);
            populateJobs();
        }
    })
}

const addListeners = () => {
    $('#submit-job-button').click(submit);
    $('#input-text').change(inputChangeHandler);
    $('#input-file').change(inputChangeHandler);
    $('#all-annotators-button').click(allNoAnnotatorsHandler);
    $('#no-annotators-button').click(allNoAnnotatorsHandler);
}

const allNoAnnotatorsHandler = (event) => {
    const elem = $(event.target);
    let checked;
    if (elem.attr('id') === 'all-annotators-button') {
        checked = true;
    } else {
        checked = false;
    }
    const annotCheckBoxes = $('.annotator-checkbox');
    for (var i = 0; i<annotCheckBoxes.length; i++){
        const cb = annotCheckBoxes[i];
        cb.checked = checked;
    }
}

const inputChangeHandler = (event) => {
    const target = $(event.target);
    const id = target.attr('id');
    if (id === 'input-file') {
        $('#input-text').val('');
    } else if (id === 'input-text') {
        const elem = $("#input-file");
        elem.wrap('<form>').closest('form').get(0).reset();
        elem.unwrap();
    }
}

var JOB_IDS = []

const populateJobs = () => {
    $.ajax({
        url:'/rest/jobs',
        type: 'GET',
        success: function (allJobs) {
            GLOBALS.jobs = [];
            for (var i=0; i<allJobs.length; i++) {
                let job = allJobs[i];
                addJob(job);
            }
            buildJobsTable();
        }
    })
}

const populateAnnotators = () => {
    $.ajax({
        url:'/rest/annotators',
        type: 'GET',
        success: function (data) {
            GLOBALS.annotators = data
            buildAnnotatorsSelector();
        }
    })
}

const buildAnnotatorsSelector = () => {
    const annotCheckDiv = $('#annotator-select-div');
    let annotators = GLOBALS.annotators;
    let annotInfos = Object.values(annotators);
    // Sort by title
    annotInfos.sort((a,b) => {
        const x = a.title.toLowerCase();
        const y = b.title.toLowerCase();
        if (x < y) {return -1;}
        if (x > y) {return 1;}
        return 0;
    });
    let checkDatas = [];
    for (let i=0; i<annotInfos.length; i++) {
        const annotInfo = annotInfos[i];
        checkDatas.push({
            name: annotInfo.name,
            value: annotInfo.name,
            label: annotInfo.title,
            checked: true
        })
    }
    buildCheckBoxGroup(checkDatas, annotCheckDiv);
}

const buildCheckBoxGroup = (checkDatas, parentDiv) => {
    parentDiv = (parentDiv === undefined) ? $(getEl('div')) : parentDiv;
    parentDiv.empty();
    parentDiv.addClass('checkbox-group');
    // all-none buttons
    const allNoneDiv = $(getEl('div'));
    parentDiv.append(allNoneDiv);
    allNoneDiv.addClass('checkbox-group-all-none-div')
    // all button
    allButton = $(getEl('button'));
    allNoneDiv.append(allButton);
    allButton.addClass('checkbox-group-all-button');
    allButton.append('All');
    allButton.click(checkBoxGroupAllNoneHandler);
    // none button
    noneButton = $(getEl('button'));
    allNoneDiv.append(noneButton);
    noneButton.attr('type','button');
    noneButton.addClass('checkbox-group-none-button');
    noneButton.append('None');
    noneButton.click(checkBoxGroupAllNoneHandler);
    // flexbox
    const flexbox = $(getEl('div'));
    parentDiv.append(flexbox);
    flexbox.addClass('checkbox-group-flexbox');
    checkDivs = [];
    // checks
    for (let i=0; i<checkDatas.length; i++) {
        const checkData = checkDatas[i];
        const checkDiv = $(getEl('div'));
        const check = $(getEl('input'));
        checkDiv.append(check);
        flexbox.append(checkDiv);
        check.addClass('checkbox-group-check');
        check.attr('type','checkbox');
        check.attr('name', checkData.name);
        check.attr('value', checkData.value)
        check.attr('checked', checkData.checked);
        const label = $(getEl('label'));
        check.after(label);
        label.attr('for',checkData.name);
        label.append(checkData.label)
        checkDivs.push(checkDiv);
    }
    // resize all to match max
    const maxWidth = Math.max.apply(null, checkDivs.map(elem => elem.width()));
    for (let i=0; i<checkDivs.length; i++) {
        let checkDiv = checkDivs[i];
        checkDiv.width(maxWidth);
    }
    return flexbox;
}

const checkBoxGroupAllNoneHandler = (event) => {
    const elem = $(event.target);
    let checked;
    if (elem.hasClass('checkbox-group-all-button')) {
        checked = true;
    } else {
        checked = false;
    }
    const checkElems = elem.closest('.checkbox-group')
                           .find('input.checkbox-group-check');
    for (var i = 0; i<checkElems.length; i++){
        const checkElem = checkElems[i];
        checkElem.checked = checked;
    }
}

const populateReports = () => {
    $.ajax({
        url:'/rest/reports',
        type: 'GET',
        success: function (data) {
            GLOBALS.reports = data
            buildReportSelector();
        }
    })
}

const buildReportSelector = () => {
    const validReports = GLOBALS.reports.valid;
    const checkData = [];
    for (var i=0; i<validReports.length; i++) {
        reportName = validReports[i];
        checkData.push({
            name: reportName,
            value: reportName,
            label: reportName[0].toUpperCase()+reportName.slice(1),
            checked: reportName === GLOBALS.reports.default
        })
    }
    const reportDiv = $('#report-select-div');
    buildCheckBoxGroup(checkData, reportDiv);
}

const run = () => {
    console.log('run');
    populateJobs();
    populateAnnotators();
    populateReports();
    addListeners();
};