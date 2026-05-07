import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource.ts";

import { userNotification } from "./notifications.ts";

/* ********************************************************** */
/*
 {
     "ip": "10.12.212.22",
     "hostname": "myfiles.grp.haufemg.com",
     "last_seen": "01-01-2024",
     "comment": "",
     "known_host": false,
     "cyber_comment": "",
     "shares": [
	{
          "share": "CIFS$",
	  "user": "SSRV_InfoSecShareScn",
	  "privileges":"READ_ONLY"
        }
     ]
 }
*/
/* ********************************************************** */
export async function smbWindow() {
	const container = document.getElementById('app') as HTMLDivElement;

	// Summary
	const h2 = document.createElement('h2');
	h2.innerText = "Summary";

	// Main table and header
	const table = document.createElement('table');
	table.id = "smbtable";
	table.className = "smbtable";
	const thead = table.createTHead();
	const headerRow = thead.insertRow();
	
	// Define the columns we want to show
	const columns = [
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
	
	columns.forEach(text => {
	    const th = document.createElement('th');
	    th.className = "smbsummaryheader";
	    th.textContent = text;
	    headerRow.appendChild(th);
	});
	
	// table body
	const tbody = document.createElement('tbody');
	table.appendChild(tbody);

	// Retrieve Data
	const client = generateClient<Schema>();

	const { data, errors } = await client.queries.getSMBHosts({});

	if (errors) {
		console.log("Error fetching SMB hosts: ", errors);
		userNotification("ERROR", "Failed to fetch SMB hosts");
		return;
	}
	console.log("data: ", data)
	
	const devices = data || [];
	devices.forEach(device => {
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
	    row.insertCell().textContent = device.comment || "unknown";
	    row.insertCell().textContent = device.cyber_status || "unknown";
        row.insertCell().textContent = device.cyber_comment || "unknown";

        /* SMB Details */
	    const d_row = tbody.insertRow();
	    d_row.className = "smbdetailsrow";
	    const details = d_row.insertCell();
	    details.className = "smbdetailscol";
	    details.colSpan = columns.length;
	    renderSmbDetails(details, device);
	});
	
	container.replaceChildren(h2, table);
}

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
    row.insertCell().appendChild(createStatusDropdown(device.status));

    row = tbody.insertRow();
    row.insertCell().textContent = "Analyst Comment";
    const c = document.createElement('span');
    c.textContent = device.cyber_comment === "" ? "click to edit" : device.cyber_comment;
    c.style.fontStyle = 'italic';
    row.insertCell().appendChild(c);

    target.appendChild(t);
}

function createStatusDropdown(currentValue: string) {
    const values = ["new", "verified", "action needed"];

    const select = document.createElement('select');
    select.className = "status-dropdown"; // For CSS styling

    values.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;

        if (val === currentValue) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    return select;
}

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