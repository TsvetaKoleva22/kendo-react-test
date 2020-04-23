import React, { useState } from 'react';
import '@progress/kendo-theme-material/dist/all.css';
import './App.scss';

import { process } from '@progress/kendo-data-query';
import { Button } from '@progress/kendo-react-buttons'
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Window } from '@progress/kendo-react-dialogs';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { Card, CardHeader, CardTitle, CardBody, CardSubtitle, Avatar } from '@progress/kendo-react-layout';
import { Scheduler, AgendaView, DayView, WeekView, WorkWeekView, MonthView } from '@progress/kendo-react-scheduler';
import { Day } from '@progress/kendo-date-math';
import { guid } from '@progress/kendo-react-common';

const CLIENT_ID = '569432039070-biskr5sghnha219qvsl41jc4evgjkmvm.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDaqaJPy603eFK1Jqr7ClB54ep0jkMWO-w';
const SCOPE_CONTACTS = 'https://www.googleapis.com/auth/contacts.readonly';
const SCOPE_GMAIL = 'https://www.googleapis.com/auth/gmail.readonly';
const SCOPE_CALENDAR = "https://www.googleapis.com/auth/calendar.readonly";

const App = () => {
    const [gridDataState, setGridDataState] = useState({
        sort: [
            { field: "sender", dir: "asc" }
        ],
        page: { skip: 0, take: 10 }
    });
    const [windowVisible, setWindowVisible] = useState(false);
    const [gridClickedRow, setGridClickedRow] = useState({});
    const [selected, setSelected] = useState(0);

    const [emails, setEmails] = useState([]);
    const [events, setEvents] = useState([]);
    const [contacts, setContacts] = useState([]);

    const getEventsGapi = () => {
        const handleAuthorization = (authorizationResult) => {
            if (authorizationResult && !authorizationResult.error) {
                fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?access_token=${authorizationResult.access_token}`)
                    .then((response) => {
                        return response.json();
                    })
                    .then((res) => {
                        let eventsResult = res.items;

                        eventsResult.forEach(e => {
                            let id = e.id;
                            let start = new Date(e.start.dateTime);
                            let end = new Date(e.end.dateTime);
                            let title = e.summary;

                            let newEvent = { id, start, end, title }
                            setEvents(oldEvents => [...oldEvents, newEvent]);
                        })
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            }
        }

        const authorize = () => {
            window.gapi.auth.authorize({ client_id: CLIENT_ID, scope: SCOPE_CALENDAR, immediate: false }, handleAuthorization);
        }

        window.gapi.client.setApiKey(API_KEY);
        window.setTimeout(authorize);
    }

    const getEmailsGapi = () => {
        const getMessages = () => {
            let request = window.gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'labelIds': 'INBOX',
                'maxResults': 50
            });

            request.execute(function (response) {
                let emailsList = response.messages;

                const storeMessage = (message) => {
                    let headers = message.payload.headers;

                    let sender = headers.find(h => h.name === 'From').value;
                    let title = headers.find(h => h.name === 'Subject').value;
                    let date = headers.find(h => h.name === 'Date').value;
                    let content = message.snippet;

                    let newEmail = { sender, title, content, date }
                    setEmails(oldEmails => [...oldEmails, newEmail]);
                }

                emailsList.forEach(m => {
                    let messageRequest = window.gapi.client.gmail.users.messages.get({
                        'userId': 'me',
                        'id': m.id
                    });

                    messageRequest.execute(storeMessage);
                });
            });
        }

        const handleAuthorization = (authResult) => {
            if (authResult && !authResult.error) {
                window.gapi.client.load('gmail', 'v1', getMessages);
            }
        }

        const authorize = () => {
            window.gapi.auth.authorize({ client_id: CLIENT_ID, scope: SCOPE_GMAIL, immediate: false }, handleAuthorization);
        }

        window.gapi.client.setApiKey(API_KEY);
        window.setTimeout(authorize);
    }

    const getContactsGapi = () => {
        const handleAuthorization = (authorizationResult) => {
            if (authorizationResult && !authorizationResult.error) {
                fetch(`https://www.google.com/m8/feeds/contacts/default/thin?alt=json&access_token=${authorizationResult.access_token}&max-results=25&updated-min=2020-03-30T00:00:00&v=3.0`)
                    .then((response) => {
                        return response.json();
                    })
                    .then((res) => {
                        let contactsResult = res.feed.entry;

                        contactsResult.forEach(c => {
                            let contactFullName = c.gd$name.gd$fullName.$t;
                            let contactTitle = c.gd$organization[0].gd$orgTitle.$t;
                            let department = c.gd$organization[0].gd$orgName.$t;
                            let photoLink = c.link[0].href;

                            fetch(`${photoLink}&access_token=${authorizationResult.access_token}`)
                                .then((response) => {
                                    let photo = response.url;
                                    let newContact = { contactFullName, contactTitle, department, photo }
                                    setContacts(oldContacts => [...oldContacts, newContact]);
                                })
                                .catch((err) => {
                                    console.log(err);
                                })
                        })
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            }
        }

        const authorize = () => {
            window.gapi.auth.authorize({ client_id: CLIENT_ID, scope: SCOPE_CONTACTS, immediate: false }, handleAuthorization);
        }

        window.gapi.client.setApiKey(API_KEY);
        window.setTimeout(authorize);
    }

    const handleGridDataStateChange = (e) => {
        setGridDataState(e.data);
    }

    const closeWindow = (e) => {
        setWindowVisible(false);
    }

    const handleGridRowClick = (e) => {
        setWindowVisible(true);
        setGridClickedRow(e.dataItem);
    }

    const handleSelect = (e) => {
        setSelected(e.selected);
    }

    const handleDataChange = ({ created, updated, deleted }) => {
        setEvents(oldSchedulerData => {
            let newSchedulerData = oldSchedulerData
                .filter((item) => deleted.find(current => current.id === item.id) === undefined)
                .map((item) => updated.find(current => current.id === item.id) || item)
                .concat(created.map((item) => Object.assign({}, item, { id: guid() })));

            return newSchedulerData;
        })
    }

    return (
        <div className="site-wrapper">
            <header className="site-header">
                <h1 className="header-title">Kendo Sample App</h1>
            </header>

            <div className="site-content">
                <TabStrip selected={selected} onSelect={handleSelect} className="site-tab-strip">
                    <TabStripTab title="Mail Inbox">
                        {!emails.length
                            ? (<Button primary={true} onClick={getEmailsGapi}>Get Emails</Button>)
                            : null}

                        <div className="site-grid-container">
                            <Grid
                                onRowClick={handleGridRowClick}
                                data={process(emails, gridDataState)}
                                pageable={true}
                                sortable={true}
                                {...gridDataState}
                                onDataStateChange={handleGridDataStateChange}
                                className="site-grid">
                                <GridColumn field="sender" width="250px" title="Sender" />
                                <GridColumn field="title" width="380px" title="Title" />
                                <GridColumn field="content" title="Content" />
                                <GridColumn field="date" width="200px" title="Date" />
                            </Grid>

                            {windowVisible
                                ? <Window
                                    title="Email Details"
                                    onClose={closeWindow}
                                    height={400}
                                    width={650}
                                    style={{ backgroundColor: '#fdf7ed' }}>
                                    <h4><span className="email-info">Title:</span> {gridClickedRow.Title}</h4>
                                    <p><span className="email-info">From:</span> {gridClickedRow.Sender}</p>
                                    <div className="email-body">
                                        <p className="email-info">Content: </p>
                                        <p className="email-content">{gridClickedRow.Content}</p>
                                    </div>
                                </Window>
                                : null
                            }
                        </div>
                    </TabStripTab>

                    <TabStripTab title="Calendar">
                        {!events.length
                            ? (<Button primary={true} onClick={getEventsGapi}>Get Events</Button>)
                            : null}
                        <div className="site-scheduler-container">
                            <Scheduler data={events}
                                onDataChange={handleDataChange}
                                editable={{ add: true, remove: true, drag: true, resize: true, edit: true }}
                                height={500}
                                className="site-scheduler">
                                <AgendaView />
                                <DayView editable />
                                <WeekView title="Full Week" />
                                <WorkWeekView title="Work Week" workWeekStart={Day.Monday} workWeekEnd={Day.Thursday} />
                                <MonthView editable />
                            </Scheduler>
                        </div>
                    </TabStripTab>

                    <TabStripTab title="Contacts">
                        {!contacts.length
                            ? (<div>
                                <Button primary={true} onClick={getContactsGapi}>Get contacts</Button>
                                <h4>Please, press the button to load contacts...</h4>
                            </div>)
                            : (<div className="site-cards-container">
                                {contacts.map(card => (
                                    <Card key={card.contactFullName} className="site-single-card">
                                        <CardHeader className="k-hbox" >
                                            <Avatar type='image' shape='circle'><img src={card.photo} alt='' /></Avatar>
                                            <div>
                                                <CardTitle style={{ marginBottom: '4px' }}>{card.contactFullName}</CardTitle>
                                                <CardSubtitle><p>{card.contactTitle}</p></CardSubtitle>
                                            </div>
                                        </CardHeader>
                                        <CardBody className="card-body"><p>{card.department}</p></CardBody>
                                    </Card>
                                ))}
                            </div>)}
                    </TabStripTab>
                </TabStrip>

            </div>

            <footer className="site-footer">
                <div>
                    {'Copyright © Motion Software '}
                    {new Date().getFullYear()}
                </div>
            </footer>
        </div>
    );
}

export default App;
