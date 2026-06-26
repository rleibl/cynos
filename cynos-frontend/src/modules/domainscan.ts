
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource.ts";
import { userNotification } from "./notifications";

// {
//     "domain": "www.businessdirektkontakt.de",
//     "ip": "217.31.86.165",
//     "classification": "Running on cloud: Hostserver",
//     "organization": "HOSTSERVER-AS - Hostserver GmbH, DE",
//     "source": "DNS File",
//     "screenshot": ""
// }

var gblDomainscanResults: any[] = [];
var lastEvaluatedKey: any = "undefined";
var prevEvaluatedKey: any = "undefined";

const gblColumns: string[] = [
    '', // copy to clipboard icon
    'Domain',
    'IP',
    'Classification',
    'Organization',
    'Source',
    'Screenshot'
];

const gblStatusValues: string[] = [
    "new",
    "unknown",
    "safe",
    "suspicious",
    "malicious"
];

/* ********************************************************** */

export async function domainScanWindow(path: string) {

    const container = document.getElementById("app") as HTMLDivElement;

    // Summary
    const h2 = document.createElement("h2");
    h2.textContent = "Domain Scan";

    // Filter
    const filterDiv = document.createElement("div");
    filterDiv.className = "domainscan-filter";
    filterDiv.textContent = "Filter: ";

    const pageDiv = document.createElement("div");
    pageDiv.id = "domainscan-item-number";

    const lblNumElements = document.createElement("span");
    lblNumElements.id = "domainscan-item-number";
    lblNumElements.textContent = "Items per page:";
    pageDiv.appendChild(lblNumElements);

    const inputNumElements = document.createElement("input");
    inputNumElements.id = "domainscan-item-number-input";
    inputNumElements.type = "number";
    inputNumElements.value = "30";
    inputNumElements.onchange = async () => {
        const client = generateClient<Schema>();
        console.log("Fetching next page of domain scan results with lastEvaluatedKey:", lastEvaluatedKey);
        var { data, errors } = await client.queries.getDomainscanResults({
            limit: parseInt(inputNumElements.value),
            lastEvaluatedKey: lastEvaluatedKey
        });
        if (errors) {
            console.error("Error fetching domain scan results:", errors);
            return;
        }
        gblDomainscanResults = data?.items || [];
        lastEvaluatedKey = data?.lastEvaluatedKey;

        renderTable();
    }
    pageDiv.appendChild(inputNumElements);

    const btnNext = document.createElement("button");
    btnNext.textContent = "Next";
    btnNext.addEventListener("click", async () => {
        const client = generateClient<Schema>();
        console.log("Fetching next page of domain scan results with lastEvaluatedKey:", lastEvaluatedKey);
        var { data, errors } = await client.queries.getDomainscanResults({
            limit: parseInt(inputNumElements.value),
            lastEvaluatedKey: lastEvaluatedKey
        });
        if (errors) {
            console.error("Error fetching domain scan results:", errors);
            return;
        }
        gblDomainscanResults = data?.items || [];
        lastEvaluatedKey = data?.lastEvaluatedKey;

        renderTable();
    });
    pageDiv.appendChild(btnNext);

    // Table
    const table = document.createElement("table");
    table.id = "haufe-table";
    table.className = "haufe-table"; // Add a class for styling

    // Header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();

    gblColumns.forEach(text => {
        const th = document.createElement("th");
        th.className = "haufe-table-summaryheader";
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Body
    const tbody = table.createTBody();
    tbody.id = "haufe-table-body";
    table.appendChild(tbody);
    container.replaceChildren(h2, filterDiv, pageDiv, table);

    const client = generateClient<Schema>();
    console.log("Fetching initial page of domain scan results with lastEvaluatedKey:", lastEvaluatedKey);
    var { data, errors } = await client.queries.getDomainscanResults({
        limit: parseInt(inputNumElements.value)
    });
    
    if (errors) {
        console.error("Error fetching domain scan results:", errors);
        return;
    }
    console.log(data);
    gblDomainscanResults = data?.items || [];
    lastEvaluatedKey = data?.lastEvaluatedKey;

    renderTable();
}


function renderTable() {
    const tbody = document.getElementById("haufe-table-body") as HTMLTableSectionElement;
    tbody.innerHTML = ""; // Clear existing rows

    gblDomainscanResults.forEach((result) => {
        const row = tbody.insertRow();
        row.className = "haufe-table-row"; // Add a class for styling
        row.addEventListener("click", toggleDetails);

        // Copy to clipboard icon
        const copyCell = row.insertCell();
        const copyIcon = document.createElement("span");
        copyIcon.className = "copy-icon";
        copyIcon.title = "Copy to clipboard";
        copyIcon.textContent = "📋";
        copyCell.appendChild(copyIcon);

        row.insertCell().textContent = result.domain;
        row.insertCell().textContent = result.ip;
        row.insertCell().textContent = result.classification;
        row.insertCell().textContent = result.organization;
        row.insertCell().textContent = result.source;

        // Screenshot cell
        const screenshotCell = row.insertCell();
        if (result.screenshot) {
            const screenshotLink = document.createElement("a");
            screenshotLink.href = result.screenshot;
            screenshotLink.target = "_blank";
            screenshotLink.textContent = "View Screenshot";
            screenshotCell.appendChild(screenshotLink);
        } else {
            screenshotCell.textContent = "N/A";
        }

        /* Details */
	    const d_row = tbody.insertRow();
	    d_row.className = "haufe-table-details-row";
	    const details = d_row.insertCell();
	    details.className = "haufe-table-details-col";
	    details.colSpan = gblColumns.length;
	    renderDetails(details, result);
    });
}

/* ********************************************************** */

function toggleDetails(event: Event) {

	const row = (event.target as HTMLElement).closest('tr.haufe-table-row') as HTMLTableRowElement;
	if(!row) {
		console.log("Could not find tr.haufe-table-row");
		return;
	}

	const detailsRow = row.nextElementSibling as HTMLTableRowElement;
	if(!detailsRow) {
		console.log("Could not find detailsRow");
		return;
	}

	if(detailsRow.style.display === "none" || 
	   detailsRow.style.display === "" ) {
		detailsRow.style.display = "table-row";
	} else {
		detailsRow.style.display = "none";
	}
}

/* ********************************************************** */

function renderDetails(target : HTMLTableCellElement, device : any) {

	const t = document.createElement('table');
	t.className = "haufe-table-details";
	const tbody = document.createElement('tbody');
	t.appendChild(tbody);

    var row = tbody.insertRow();
    row.insertCell().textContent = "First Seen";
    row.insertCell().textContent = device.first_seen || "unknown";

    row = tbody.insertRow();
    row.insertCell().textContent = "Last Seen";
    row.insertCell().textContent = device.last_seen || "unknown";

    row = tbody.insertRow();
    row.insertCell().textContent = "Status";
    row.insertCell().appendChild(createStatusDropdown(device));

    row = tbody.insertRow();
    row.insertCell().textContent = "Analyst Comment";
    row.insertCell().appendChild(createCommentCell(device));

    target.appendChild(t);
}

/* ********************************************************** */

function createStatusDropdown(device: any) {

    const currentValue = device.cyber_status || "unknown";
    const select = document.createElement('select');
    //select.className = "status-dropdown"; // For CSS styling

    gblStatusValues.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;

        if (val === currentValue) {
            option.selected = true;
        }

        select.appendChild(option);
    });
    select.addEventListener('change', async (event: Event) => {
        const newValue = (event.target as HTMLSelectElement).value;
        const client = generateClient<Schema>();
        const { data, errors } = await client.mutations.setSMBShare({
            hostname: device.hostname,
            share_name: device.share_name,
            cyber_status: newValue
        });
        if (errors) {
            console.log("Error updating status: ", errors);
            userNotification("ERROR", "Failed to update status");
            // revert to old value in case of error
            (event.target as HTMLSelectElement).value = currentValue;
            return;
        }
        console.log("data: ", data);
        device.cyber_status = newValue;
    });

    return select;
}

/* ********************************************************** */

function createCommentCell(device: any) {
    const commentCell = document.createElement('td');
    const c = document.createElement('span');
    c.textContent = device.cyber_comment ? device.cyber_comment : "click to edit";
    c.style.fontStyle = 'italic';
    c.style.cursor = 'pointer';

    const renderDisplay = () => {
        c.textContent = device.cyber_comment ? device.cyber_comment : "click to edit";
        commentCell.replaceChildren(c);
    };

    const saveComment = async (newValue: string) => {
        const client = generateClient<Schema>();
        const { data, errors } = await client.mutations.setSMBShare({
            hostname: device.hostname,
            share_name: device.share_name,
            cyber_comment: newValue.trim()
        });
        if (errors) {
            console.log("Error saving comment: ", errors);
            userNotification("ERROR", "Failed to save comment");
            return;
        }
        console.log("data: ", data);
        device.cyber_comment = newValue.trim();
        renderDisplay();
    };

    const renderEditor = () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = device.cyber_comment || "";

        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.textContent = 'save';

        const save = () => saveComment(input.value);

        saveButton.addEventListener('click', (event: Event) => {
            event.stopPropagation();
            save();
        });

        input.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                save();
            }
        });

        commentCell.replaceChildren(input, saveButton);
        input.focus();
    };

    c.addEventListener('click', (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        renderEditor();
    });

    commentCell.appendChild(c);

    return commentCell;
}
