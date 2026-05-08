import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource.ts";

import { userNotification } from "./notifications.ts";

/* ********************************************************** */
/* globals                                                    */
/* ********************************************************** */

// must be global to be accessible when rendering the table and re-rendering after filtering
var gblShares: any[] = [];

// must be global to be accessible in multiple functions and consistent with the table header
const gblColumns: string[] = [
    "", // copy to clipboard icon
    "Hostname",
    "Share",
    "Privileges",
    "IP Address",
    "Last Seen",
    "Comment",
    "Status",
    "Analyst Notes"
];

const gblStatusValues: string[] = [
    "new",
    "verified",
    "action needed"
];
	

/* ********************************************************** */
function renderTable() {
    const tbody = document.getElementById("smbtablebody") as HTMLTableSectionElement; // for access when re-rendering the table
    tbody.replaceChildren(); // clear existing rows

    const filteredDevices = gblShares.filter(device => {

        // filter for status first
        const statusFilter = (document.getElementById("statusFilter") as HTMLSelectElement).value;
        if(statusFilter !== "all" && device.cyber_status !== statusFilter) {
            return false;
        }

        // then filter for search term: hostname, share name and IP are included
        const searchTerm = (document.getElementById("searchInput") as HTMLInputElement).value.toLowerCase();
        if(searchTerm) {
            const combined = (device.hostname + " " + device.share_name + " " + device.ip).toLowerCase();
            return combined.includes(searchTerm);
        }

        return true;
    });

	filteredDevices.forEach(device => {
		if(!device) {return;}

	    const row = tbody.insertRow();
	    row.className = "smbsummaryrow";
	    row.addEventListener("click", toggleSmbDetail);
	
        // icon to copy the smb url to clipboard
        const i = document.createElement("img");
        i.src = "/copy24.png";
        i.addEventListener("click", async function(e: Event) {
                e.preventDefault();
                e.stopPropagation();
                const l = "\\\\" + device.hostname + "\\" + device.share_name;  
                try {
                    await navigator.clipboard.writeText(l);
                    console.log("Copy to clipboard");
                } catch (err) {
                    console.log("Failed to copy text");
                }
                return false;
        });
        row.insertCell().appendChild(i);
	    row.insertCell().textContent = device.hostname || "unknown";
	    row.insertCell().textContent = device.share_name || "unknown";
	    row.insertCell().textContent = device.privileges || "unknown";
	    row.insertCell().textContent = device.ip || "unknown";
	    row.insertCell().textContent = device.last_seen || "unknown";
	    row.insertCell().textContent = device.comment || "";
	    row.insertCell().textContent = device.cyber_status || "unknown";
        row.insertCell().textContent = device.cyber_comment || "";

        /* SMB Details */
	    const d_row = tbody.insertRow();
	    d_row.className = "smbdetailsrow";
	    const details = d_row.insertCell();
	    details.className = "smbdetailscol";
	    details.colSpan = gblColumns.length;
	    renderSmbDetails(details, device);
	});
}

/* ********************************************************** */
function renderSummaryAndFilter() {
    const filterDiv = document.createElement('div');
    filterDiv.className = "summary-filter";

    const searchLabel = document.createElement('label');
    searchLabel.htmlFor = "searchInput";
    searchLabel.textContent = "Search: ";

    const searchInput = document.createElement('input');
    searchInput.type = "text";
    searchInput.id = "searchInput";
    searchInput.placeholder = "Hostname, share or IP";
    searchInput.addEventListener("input", function () { renderTable(); });

    filterDiv.appendChild(searchLabel);
    filterDiv.appendChild(searchInput);
    
    const filterLabel = document.createElement('label');
    filterLabel.htmlFor = "statusFilter";
    filterLabel.textContent = "Filter by status: ";

    const filterSelect = document.createElement('select');
    filterSelect.id = "statusFilter";
    filterSelect.addEventListener("change", function () { renderTable(); });

    ["all", ...gblStatusValues].forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue.charAt(0).toUpperCase() + optionValue.slice(1);
        filterSelect.appendChild(option);
    });

    filterDiv.appendChild(filterLabel);
    filterDiv.appendChild(filterSelect);

    return filterDiv;
}

/* ********************************************************** */
export async function smbWindow() {
	const container = document.getElementById('app') as HTMLDivElement;

	// Summary
	const h2 = document.createElement('h2');
	h2.innerText = "Summary";

    // Summary and filter
    const filterDiv = renderSummaryAndFilter();

	// Main table and header
	const table = document.createElement('table');
	table.id = "smbtable";
	table.className = "smbtable";
	const thead = table.createTHead();
	const headerRow = thead.insertRow();
	
	gblColumns.forEach(text => {
	    const th = document.createElement('th');
	    th.className = "smbsummaryheader";
	    th.textContent = text;
	    headerRow.appendChild(th);
	});

	// table body
	const tbody = document.createElement('tbody');
    tbody.id = "smbtablebody"; // for access when re-rendering the table
	table.appendChild(tbody);

	container.replaceChildren(h2, filterDiv, table);
	
	const client = generateClient<Schema>();
	const { data, errors } = await client.queries.getSMBShares({});

	if (errors) {
		console.log("Error fetching SMB shares: ", errors);
		userNotification("ERROR", "Failed to fetch SMB shares");
		return;
	}
	console.log("data: ", data)
	
	gblShares = data || [];
    renderTable();
	
}

/* ********************************************************** */
function renderSmbDetails(target : HTMLTableCellElement, device : any) {

	const t = document.createElement('table');
	t.className = "smbdetails";
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

/* ********************************************************** */
function createStatusDropdown(device: any) {

    const currentValue = device.cyber_status || "unknown";
    const select = document.createElement('select');
    select.className = "status-dropdown"; // For CSS styling

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
function toggleSmbDetail(event: Event) {

	const row = (event.target as HTMLElement).closest('tr.smbsummaryrow');
	if(!row) {
		console.log("Could not find tr.smbsummaryrow");
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