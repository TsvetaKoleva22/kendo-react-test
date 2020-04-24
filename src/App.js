import React, { useState } from 'react';
import '@progress/kendo-theme-material/dist/all.css';
import './App.scss';

import { Button } from '@progress/kendo-react-buttons'
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { guid } from '@progress/kendo-react-common';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import MailInbox from './components/MailInbox';
import Calendar from './components/Calendar';
import Contacts from './components/Contacts';

const CLIENT_ID = '662100423876-6t4i513ifkbp445limevil1r5fse9f4b.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCN-kc8wJLga7AIuYIwISvXTwRQeULyANc';
const SCOPE_CONTACTS = 'https://www.googleapis.com/auth/contacts.readonly';
const SCOPE_GMAIL = 'https://www.googleapis.com/auth/gmail.readonly';
const SCOPE_CALENDAR = "https://www.googleapis.com/auth/calendar.readonly";

const App = () => {
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
                fetch(`https://www.google.com/m8/feeds/contacts/default/full?alt=json&access_token=${authorizationResult.access_token}&max-results=25&v=3.0`)
                    .then((response) => {
                        return response.json();
                    })
                    .then((res) => {
                        let contactsResult = res.feed.entry;
                        contactsResult = contactsResult.filter(c => c.gd$name);

                        contactsResult.forEach(c => {

                            const tryFn = (fn, fallback = null) => {
                                try {
                                    return fn();
                                } catch (error) {
                                    return fallback;
                                }
                            }

                            let contactFullName = tryFn(() => c.gd$name.gd$fullName.$t, 'No full name');
                            let contactTitle = tryFn(() => c.gd$organization[0].gd$orgTitle.$t, 'No title');
                            let department = tryFn(() => c.gd$organization[0].gd$orgName.$t, 'No department');
                            let photoLink = tryFn(() => c.link[0].href);

                            if (photoLink) {
                                fetch(`${photoLink}&access_token=${authorizationResult.access_token}`)
                                    .then((response) => {
                                        let photo = response.url;
                                        let newContact = { contactFullName, contactTitle, department, photo }
                                        setContacts(oldContacts => [...oldContacts, newContact]);
                                    })
                                    .catch((err) => {
                                        console.log(err);
                                    })
                            } else {
                                let newContact = { contactFullName, contactTitle, department, photo: '' }
                                setContacts(oldContacts => [...oldContacts, newContact]);
                            }
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
            <Header />

            <div className="site-content">
                <TabStrip selected={selected} onSelect={handleSelect} className="site-tab-strip">
                    <TabStripTab title="Mail Inbox">
                        {!emails.length
                            ? (<Button primary={true} onClick={getEmailsGapi}>Get Emails</Button>)
                            : null}
                        <MailInbox emails={emails} />
                    </TabStripTab>

                    <TabStripTab title="Calendar">
                        {!events.length
                            ? (<Button primary={true} onClick={getEventsGapi}>Get Events</Button>)
                            : null}
                        <Calendar events={events} handleDataChange={handleDataChange} />
                    </TabStripTab>

                    <TabStripTab title="Contacts">
                        {!contacts.length
                            ? (<div>
                                <Button primary={true} onClick={getContactsGapi}>Get contacts</Button>
                                <h4>Please, press the button to load contacts...</h4>
                            </div>)
                            : <Contacts contacts={contacts} />}
                    </TabStripTab>
                </TabStrip>

            </div>

            <Footer />
        </div>
    );
}

export default App;
