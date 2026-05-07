
/* ********************************************************** */
export function userNotification(status: "ERROR" | "OK" | "INFO", msg: string) {

	var s = document.createElement('span');
	if( status == "ERROR" ) {
		s.style.color = "red";
	} else if( status === "OK" ) {
		s.style.color = "green";
	} // else white

	s.textContent = msg;

	const parent = document.getElementById('notifications') as HTMLDivElement;
	parent.replaceChildren(s);
}
