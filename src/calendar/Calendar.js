import React, { Component } from 'react';
import { DayPilot, DayPilotCalendar, DayPilotNavigator } from "daypilot-pro-react";
import "./CalendarStyles.css";

var randomWords = require('random-words');

const styles = {
  wrap: {
    display: "flex"
  },
  left: {
    marginRight: "10px"
  },
  main: {
    flexGrow: "1"
  }
};

class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewType: "Week",
      durationBarVisible: false,
      dayBeginsHour: 8,
      dayEndsHour: 19,
      weekStarts: 1,
      heightSpec: "Full",
      eventMoveHandling: "Disabled",
      eventResizeHandling: "Disabled",
      eventDeleteHandling: "Update",
      crosshairType: "Full",
      allowEventOverlap: false,
      headerDateFormat: "dd/MM/yyyy",
      onTimeRangeSelected: async args => {
        const dp = this.calendar;
        const modal = await DayPilot.Modal.prompt("Create a new event:", "");
        dp.clearSelection();

        if (!modal.result) {
          return;
        }

        let createEvent = true;
        const newEventDay = parseInt(args.start.value.substring(8, 10));
        const newEventMonth = parseInt(args.start.value.substring(5, 7));
        // check for two same events in one day
        dp.events.list.forEach(event => {
          const oldEventDay = parseInt(event.start.value.substring(8, 10));
          const oldEventMonth = parseInt(event.start.value.substring(5, 7));
          if (newEventDay === oldEventDay && newEventMonth === oldEventMonth && modal.result === event.text) {
            DayPilot.Modal.alert("You can only create one unique event per day");
            createEvent = false;
          }
        });

        if (!createEvent) {
          return;
        }

        // check for three same events in one week
        const curr = new Date(args.start);
        const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1)).getDate();
        const firstMonth = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1)).getMonth() + 1;
        const lastDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7)).getDate();
        const lastMonth = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7)).getMonth() + 1;

        let sameEventCount = 0;
        dp.events.list.forEach(event => {
          const oldEventDay = parseInt(event.start.value.substring(8, 10));
          const oldEventMonth = parseInt(event.start.value.substring(5, 7));

          // check if the same text event already exist
          if (modal.result === event.text) {
            // check if the already existing event which has identical text 
            // is within the month and week range of newly added event
            if (firstMonth === lastMonth && oldEventMonth === firstMonth) {
              if (oldEventDay >= firstDay && oldEventDay <= lastDay) {
                sameEventCount++;
              }
            } else //case when the week is split into 2 months
              if ((oldEventMonth === firstMonth || oldEventMonth === lastMonth) &&
                ((oldEventDay >= firstDay && oldEventMonth === firstMonth) || (oldEventDay <= lastDay && oldEventMonth === lastMonth))) {
                sameEventCount++;
              }
          }
        });

        if (sameEventCount > 1) {
          DayPilot.Modal.alert("You can only create two same events per week");
          createEvent = false;
        }
        if (createEvent) {
          dp.events.add({
            id: DayPilot.guid(),
            start: args.start,
            end: args.end,
            text: modal.result
          });
        }
        return;
      },

      onTimeRangeSelecting: async args => {
        if (args.duration.totalHours() > 0.5) {
          args.allowed = false;
        }
      }
    };
  }

  componentDidMount() {
    let _events = generateEvents();
    // load event data
    this.setState({
      startDate: "2021-11-01",
      events: _events
    });
  }

  render() {
    var { ...config } = this.state;
    return (
      <div style={styles.wrap}>
        <div style={styles.left}>
          <DayPilotNavigator
            selectMode={"week"}
            showMonths={1}
            weekStarts={1}
            startDate={"2021-11-01"}
            selectionDay={"2021-11-01"}
            onTimeRangeSelected={args => {
              this.setState({
                startDate: args.day
              });
            }}
          />
        </div>
        <div style={styles.main}>
          <DayPilotCalendar
            {...config}
            ref={component => {
              this.calendar = component && component.control;
            }}
          />
        </div>
      </div>
    );
  }
}

function getCurrentWeekNumber(currentDate) {
  const oneJan = new Date(currentDate.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((currentDate - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((currentDate.getDay() + 1 + numberOfDays) / 7);
}

function officeClosedEvent(dayString, start, end) {
  if (!start && !end) {
    start = "08:00";
    end = "19:00";
  }
  return {
    id: DayPilot.guid(),
    deleteDisabled: true,
    clickDisabled: true,
    text: "Out of Office",
    start: "2021-11-" + dayString + "T" + start + ":00",
    end: "2021-11-" + dayString + "T" + end + ":00",
    backColor: "#ee4037"
  }
}

function lunchBreakEvent(dayString, start, end) {
  return {
    id: DayPilot.guid(),
    deleteDisabled: true,
    clickDisabled: true,
    text: "Lunch Break",
    start: "2021-11-" + dayString + "T" + start + ":00",
    end: "2021-11-" + dayString + "T" + end + ":00",
    backColor: "#fbaf40"
  }
}

function generateEvents() {
  let _events = [];
  // This could be modified to accept month and year as parameter 
  // For case of this demo, it only generates events for November 2021
  for (let day = 1; day <= 30; day++) {
    // get current day as string
    let dayString = day < 10 ? "0" + day : "" + day;
    // get current week number
    let currentWeek = getCurrentWeekNumber(new Date("2021-11-" + dayString + "T12:00:00"));
    // Closed office on Sundays event
    if (day % 7 === 0) {
      _events.push(officeClosedEvent(dayString));
    } else
      // Closed office on odd Saturdays event
      if (day % 7 === 6 && currentWeek % 2 === 1) {
        _events.push(officeClosedEvent(dayString));
      } else
        // Odd days office hours event
        if (day % 2 === 1) {
          _events.push(officeClosedEvent(dayString, "08:00", "13:00"));
          _events.push(lunchBreakEvent(dayString, "16:00", "16:30"));
        }
        // Even days office hours event
        else {
          _events.push(officeClosedEvent(dayString, "14:00", "19:00"));
          _events.push(lunchBreakEvent(dayString, "11:00", "11:30"));
        }
  }
  // generate 15 random events
  for (let day = 1; day <= 5; day++) {
    let dayString = "0" + day;
    let randomTimes = [];
    while (randomTimes.length < 3) {
      if (day % 2 === 0) { //pick from 8 - 14
        const randomTime = Math.floor(Math.random() * (13 - 8 + 1)) + 8;
        if (randomTime !== 11 && !randomTimes.includes(randomTime)) {
          randomTimes.push(randomTime);
        }
      } else { //pick from 14 - 18
        const randomTime = Math.floor(Math.random() * (18 - 13 + 1)) + 13;
        if (randomTime !== 16 && !randomTimes.includes(randomTime)) {
          randomTimes.push(randomTime);
        }
      }
    }
    for (let i = 0; i < 3; i++) {
      let randomTimeString = randomTimes[i] < 10 ? "0" + randomTimes[i] : "" + randomTimes[i];
      _events.push({
        id: DayPilot.guid(),
        clickDisabled: true,
        text: randomWords(),
        start: "2021-11-" + dayString + "T" + randomTimeString + ":00:00",
        end: "2021-11-" + dayString + "T" + randomTimeString + ":30:00",
        backColor: "#38618c"
      })
    }
  }
  return _events;
}

export default Calendar;