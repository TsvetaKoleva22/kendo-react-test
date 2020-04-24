import React from 'react';
import '@progress/kendo-theme-material/dist/all.css';
import './Contacts.scss';

import { Card, CardHeader, CardTitle, CardBody, CardSubtitle, Avatar } from '@progress/kendo-react-layout';

const Calendar = ({
    contacts
}) => (
    <div className="site-cards-container">
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
    </div>
);

export default Calendar;
