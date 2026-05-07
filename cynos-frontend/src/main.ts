import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource.ts";
import './style.css'
import { Amplify } from "aws-amplify";

import { getCurrentUser } from 'aws-amplify/auth'
import { fetchUserAttributes } from 'aws-amplify/auth'

import { loginWindow } from "./modules/authentication.ts";
import { registerWindow } from "./modules/authentication.ts";
import { verifyWindow } from "./modules/authentication.ts";
import { userNotification } from "./modules/notifications.ts";
import { smbWindow } from "./modules/smb.ts";

import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

/* ********************************************************** */
async function checkUser() {
  try {
    const { username, userId, signInDetails } = await getCurrentUser();
    console.log(`Current user: ${username}`);
    console.log(`  userId: ${userId}`);
    console.log(`  SignInDetails: ${signInDetails}`);
    return [true, username];
  } catch (err) {
    console.log(err);
    console.log("User is not signed in");
    return [false, ""];
  }
}


/* ********************************************************** */
async function mainWindow(userid: string) {

	/* ****************** Page setup ******************** */

	// Get parent
	const parent = document.getElementById('app') as HTMLDivElement;

	const h1 = document.createElement('h1');
	h1.textContent = 'Summary';

	var username = "unknown";
    try {
        const attributes = await fetchUserAttributes();
        console.log("User attributes: ", attributes);
        username = attributes['email'] || "unknown";
  	} catch (err) {
    		console.log(err);
	}
	const greeting = document.createTextNode('user');
	greeting.textContent = "Hello " + username;

	const h2 = document.createElement('h2');
	h2.textContent = 'Last check for RSS updates';

	const span = document.createElement('span');
	span.id = 'rsslastcheck';
	span.textContent = 'never';

	// Swap the old content for the new elements
	parent.replaceChildren(h1, greeting, h2, span);

	/* ****************** Page setup done *************** */

	const client = generateClient<Schema>();

	const rss_check_field = document.getElementById("rsslastcheck") as HTMLSpanElement;

	const { data, errors } = await client.queries.getRss({});
	if (errors) {
		console.log("Error fetching RSS data: ", errors);
		userNotification("ERROR", "Failed to fetch RSS data");
		return;
	}
	console.log("data: ", data)

	const unixTimestamp = data ? data['t'] || 0 : 0;
	const date = new Date(unixTimestamp * 1000);
	rss_check_field.innerHTML = date.toLocaleString();

	userNotification("OK", "test notification");
	//userNotification("ERROR", "test error");
}

function mk_link_navigation(path: string, text: string, highlight_path: string) {
	const l = document.createElement('a');
	l.href = path;
	l.textContent = text
	l.rel = "noopener noreferrer";
	if( path == highlight_path ) {
		l.style.color = "white";
		l.style.fontWeight = "bold";
	}

	return l;
}
/* ********************************************************** */
async function navigation(path: string) {

	var parent = document.getElementById('navigation') as HTMLDivElement;

	const lhome = mk_link_navigation('/', "home", path);
	const lalerts = mk_link_navigation('/alerts', "Alerts", path);
	const lsmb = mk_link_navigation('/smb', "SMB", path);

	var content = [
		lhome,
		" | ",
		lalerts,
		" | ",
		lsmb
	];
	parent.replaceChildren(...content);
}
/* ********************************************************** */
async function routeAuthenticated(path: string) {

	var [loggedin, userid] = await checkUser();
	if (!loggedin || typeof userid !== "string") {
		loginWindow();
		return;
	}

	navigation(path);

	switch (path) {
		case "/":
			mainWindow(userid);
			break;
		case "/smb":
		case "/smb/":
			smbWindow();
			break;
		default:
			console.log("Unknown path: " + path);
			mainWindow(userid);
			
	}
}

/* **********************************************************
 * Routing
 * **********************************************************/
var u = new URL(window.location.href);

const path = u.pathname;
switch (path) {
	case '/login':
	case '/login/':
		console.log("Routing: /login");
		loginWindow();
		break;
	case '/register':
	case '/register/':
		console.log("Routing: /register");
		registerWindow();
		break;
	case '/verify':
	case '/verify/':
		console.log("Routing: /verify");
		verifyWindow();
		break;
	default:
		console.log("Routing (Authenticated): " + path);
		routeAuthenticated(path);
}

