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
    const filterDiv = document.createElement('div');
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

    // FIXME filter here

    gblFindings.forEach(data => {

        // Main Row
        var row = document.createElement('tr');
        row.className = "haufe-table-row";
        row.insertCell().textContent = data["name"] || "";
        row.insertCell().innerHTML = (data["values"] || []).join(",<br>");

        // Add status cell
        // Add a static name, such that we can find the cell later to update it
        // when the status is changed in the details view.
        const c = row.insertCell()
        c.textContent = data["cyber_status"] || "new";
        c.id = `status-${data["name"]}`;

        // FIXME, same here. Give a static name to find later
        row.insertCell().textContent = data["cyber_comment"] || "";
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
        row.insertCell().textContent = data["cyber_comment"] || "new";

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