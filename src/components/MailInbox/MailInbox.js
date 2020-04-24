import React, { useState } from 'react';
import '@progress/kendo-theme-material/dist/all.css';
import './MailInbox.scss';

import { process } from '@progress/kendo-data-query';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Window } from '@progress/kendo-react-dialogs';

const MailInbox = ({
    emails
}) => {
    const [gridDataState, setGridDataState] = useState({
        sort: [
            { field: "sender", dir: "asc" }
        ],
        page: { skip: 0, take: 10 }
    });
    const [windowVisible, setWindowVisible] = useState(false);
    const [gridClickedRow, setGridClickedRow] = useState({});

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

    return (
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
                    <h4><span className="email-info">Title:</span> {gridClickedRow.title}</h4>
                    <p><span className="email-info">From:</span> {gridClickedRow.sender}</p>
                    <div className="email-body">
                        <p className="email-info">Content: </p>
                        <p className="email-content">{gridClickedRow.content}</p>
                    </div>
                </Window>
                : null
            }
        </div>
    );
}

export default MailInbox;
