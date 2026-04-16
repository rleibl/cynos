import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resources";
import './style.css'
import { Amplify } from "aws-amplify";
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

const client = generateClient<Schema>();

const rss_check_field = document.getElementById("rsslastcheck");

const { data, errors } = await client.queries.getRss();
console.log("data: ", data)
console.log("errors: ", errors);

const unixTimestamp = data['t'];
const date = new Date(unixTimestamp * 1000);
rss_check_field.innerHTML = date.toLocaleString();
