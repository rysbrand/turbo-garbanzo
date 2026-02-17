//User data

//Get user name from localStorage (set this during login)
const storedUser = JSON.parse(localStorage.getItem("user"));

const name = storedUser?.firstName || "User";


//sample schedule data
//(Later replace this with Supabase data)

const schedule = [
    { date: "2026-02-17", start: "9:00 AM", end: "5:00 PM" },
    { date: "2026-02-19", start: "10:00 AM", end: "6:00 PM" },
    { date: "2026-02-22", start: "8:00 AM", end: "4:00 PM" }
];


//Today logic

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const todayDateNumber = today.getDate();

const formattedTodayISO = today.toISOString().split("T")[0];

//Check if user works today
const todayShift = schedule.find(shift => shift.date === formattedTodayISO);

//Format readable date
const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
});

let welcomeMessage;

if (todayShift) {
    welcomeMessage = `Welcome ${name}, you work today ${formattedDate} from ${todayShift.start} to ${todayShift.end}`;
} else {
    welcomeMessage = `Welcome ${name}, you do not work today (${formattedDate})`;
}

document.getElementById("welcomeMessage").innerText = welcomeMessage;


//Calendar generation logic

const calendarDays = document.getElementById("calendarDays");
const calendarHeader = document.getElementById("calendarHeader");

calendarDays.innerHTML = "";

const monthName = today.toLocaleString("default", { month: "long" });
calendarHeader.innerText = `${monthName} ${year}`;

const firstDay = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();

//Empty boxes before first day
for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    calendarDays.appendChild(blank);
}

//Generate actual days
for (let day = 1; day <= daysInMonth; day++) {

    const dateObj = new Date(year, month, day);
    const isoDate = dateObj.toISOString().split("T")[0];

    const dayElement = document.createElement("div");
    dayElement.innerText = day;

    dayElement.className =
        "p-2 rounded text-sm cursor-pointer hover:bg-slate-700 transition";

    //Highlight today
    if (day === todayDateNumber) {
        dayElement.className =
            "p-2 rounded text-sm bg-indigo-600 font-semibold";
    }

    //Highlight work days
    if (schedule.some(shift => shift.date === isoDate)) {
        dayElement.classList.add("border", "border-indigo-500");
    }

    calendarDays.appendChild(dayElement);
}
