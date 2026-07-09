import type { Schema } from "../../amplify/data/resource.ts";
import { generateClient } from "aws-amplify/data";

import { userNotification } from "./notifications.ts";

const gblColumns: string[] = [
    "name",
    "values",
    "status",
    "comment"
];

const gblStatusValues: string[] = [
    "new",
    "open",
    "closed",
    "in_progress"
];

var gblFindings: any[] = [];


export async function dnsZombieWindow(path: string) {
    const client = generateClient<Schema>();
	const { data, errors } = await client.queries.getDnsZombieResults({});

	if (errors) {
		console.log("Error fetching DNS Zombie results: ", errors);
		userNotification("ERROR", "Failed to fetch DNS Zombie results");
		return;
	}
	console.log("data: ", data)
    gblFindings = data || [];

    const tableContainer = document.getElementById("app") as HTMLDivElement;

    // summary
    const h2 = document.createElement('h2');
    h2.textContent = "DNS Zombie Findings";
    tableContainer.appendChild(h2);

    // Filter
    const filterDiv = createSummaryAndFilter();
    tableContainer.appendChild(filterDiv);

    // Main table and header
    const table = document.createElement('table');
    table.id = "haufe-table";
    table.className = "haufe-table";

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    gblColumns.forEach(column => {
        console.log("column: ", column);
        const columnHeader = document.createElement('th');
        columnHeader.textContent = column;
        headerRow.appendChild(columnHeader);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    tbody.id = "haufe-table-body";
    table.appendChild(tbody);

    tableContainer.appendChild(table);
    renderTableBody();
}

function renderTableBody() {
    const tbody = document.getElementById("haufe-table-body") as HTMLTableSectionElement;
    tbody.innerHTML = ""; // Clear existing rows

    const filteredDevices = gblFindings.filter(data => {
        const filterInput = document.getElementById("filter-input") as HTMLInputElement;
        const filterValue = filterInput ? filterInput.value.toLowerCase() : "";

        const statusSelect = document.getElementById("status-select") as HTMLSelectElement;
        const selectedStatus = statusSelect ? statusSelect.value : "";

        const matchesFilter = !filterValue || (data["name"] && data["name"].toLowerCase().includes(filterValue)) || (data["values"] && data["values"].some((val: string) => val.toLowerCase().includes(filterValue)));
        const matchesStatus = !selectedStatus || (data["cyber_status"] === selectedStatus);

        return matchesFilter && matchesStatus;
    });

    filteredDevices.forEach(data => {

        // Main Row
        var row = document.createElement('tr');
        row.className = "haufe-table-row";
        row.insertCell().textContent = data["name"] || "";
        row.insertCell().innerHTML = (data["values"] || []).join(",<br>");

        // Add status cell
        // Add a static name, such that we can find the cell later to update it
        // when the status is changed in the details view.
        const statusCell = row.insertCell()
        statusCell.textContent = data["cyber_status"] || "new";
        statusCell.id = `status-${data["name"]}`;

        // FIXME, same here. Give a static name to find later
        const commentCell = row.insertCell();
        commentCell.textContent = data["cyber_comment"] || "";
        commentCell.id = `comment-${data["name"]}`;

        row.addEventListener('click', toggleDetailsRow);
        tbody.appendChild(row);

        // Details Row
        const detailsRow = tbody.insertRow();
        detailsRow.className = "haufe-table-details-row";
        const detailsCell = detailsRow.insertCell();
        detailsCell.colSpan = Object.keys(gblColumns).length;
        detailsCell.className = "haufe-table-details-col";

        renderDetailsRow(detailsCell, data);
    });
}

function createSummaryAndFilter() {
    const summaryDiv = document.createElement('div');
    summaryDiv.id = "filter-div";

    const summarySpan = document.createElement('span');
    summarySpan.id = "summary-span";
    summarySpan.textContent = `Total Findings: ${gblFindings.length}`;
    summaryDiv.appendChild(summarySpan);
    
    const filterDiv = document.createElement('div');
    const filterSpan = document.createElement('span');
    filterSpan.textContent = "Filter: ";
    filterDiv.appendChild(filterSpan);
    const filterInput = document.createElement('input');
    filterInput.id = "filter-input";
    filterInput.placeholder = "Filter findings...";
    filterInput.addEventListener('input', () => { renderTableBody(); });
    filterDiv.appendChild(filterInput);

    const selectDiv = document.createElement('div');
    const selectSpan = document.createElement('span');
    selectSpan.textContent = "Status: ";
    selectDiv.appendChild(selectSpan);
    const statusSelect = document.createElement('select');
    statusSelect.id = "status-select";
    const allOption = document.createElement('option');
    allOption.value = "";
    allOption.textContent = "All";
    statusSelect.appendChild(allOption);
    gblStatusValues.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
    });
    statusSelect.addEventListener('change', () => { renderTableBody(); });
    selectDiv.appendChild(statusSelect);

    summaryDiv.appendChild(filterDiv);
    summaryDiv.appendChild(selectDiv);

    return summaryDiv;
}

function renderDetailsRow(target: HTMLTableCellElement, data: any) {

        const t = document.createElement('table');
        t.className = "haufe-table-details";
        const detailsTbody = document.createElement('tbody');
        t.appendChild(detailsTbody);

        var row = detailsTbody.insertRow();
        row.insertCell().textContent = "issue_id";
        row.insertCell().textContent = data["issue_id"] || "";

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "asset_type";
        row.insertCell().textContent = data["asset_type"] || "";

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "asset_id";
        row.insertCell().textContent = data["asset_id"] || "";

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "issue_type";
        row.insertCell().textContent = data["issue_type"] || "";

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "first_seen";
        row.insertCell().textContent = data["first_seen"] || "";

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "last_seen";
        row.insertCell().textContent = data["last_seen"] || "";

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "Status";
        row.insertCell().appendChild(createStatusDropdown(data));

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "Comment";
        row.insertCell().appendChild(createCommentCell(data));

        row = detailsTbody.insertRow();
        row.insertCell().textContent = "history";
        row.insertCell().textContent = (data["history"] || []).join(",<br>");

        target.appendChild(t);
}

function toggleDetailsRow(event: Event) {

    const row = (event.target as HTMLElement).closest('tr.haufe-table-row') as HTMLTableRowElement;
    if (!row) {
        console.log("Row not found");
        return;
    }
    const detailsRow = row.nextElementSibling as HTMLTableRowElement;
    if (!detailsRow) {
        console.log("Details row not found");
        return;
    }

    if(detailsRow.style.display === "none" || detailsRow.style.display === "") {
        detailsRow.style.display = "table-row";
    } else {
        detailsRow.style.display = "none";
    }
}

function createStatusDropdown(finding: any) {

    const currentValue = finding.cyber_status || "unknown";
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
        console.log(`Updating status for ${finding.name} from ${currentValue} to ${newValue}`);
        const { data, errors } = await client.mutations.setDnsZombieItem({
            name: finding.name,
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
        finding.cyber_status = newValue;
        document.getElementById(`status-${finding.name}`)!.textContent = newValue;
    });

    return select;
}

/* ********************************************************** */

function createCommentCell(finding: any) {
    const commentCell = document.createElement('td');
    const c = document.createElement('span');
    c.textContent = finding.cyber_comment ? finding.cyber_comment : "click to edit";
    c.style.fontStyle = 'italic';
    c.style.cursor = 'pointer';

    const renderDisplay = () => {
        c.textContent = finding.cyber_comment ? finding.cyber_comment : "click to edit";
        commentCell.replaceChildren(c);
    };

    const saveComment = async (newValue: string) => {
        const client = generateClient<Schema>();
        const { data, errors } = await client.mutations.setDnsZombieItem({
            name: finding.name,
            cyber_comment: newValue.trim()
        });
        if (errors) {
            console.log("Error saving comment: ", errors);
            userNotification("ERROR", "Failed to save comment");
            return;
        }
        console.log("data: ", data);
        finding.cyber_comment = newValue.trim();
        document.getElementById(`comment-${finding.name}`)!.textContent = newValue.trim();
        renderDisplay();
    };

    const renderEditor = () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = finding.cyber_comment || "";

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