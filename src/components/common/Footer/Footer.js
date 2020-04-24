import React from 'react';
import './Footer.scss';

const Footer = (props) => (
    <footer className="site-footer">
        <div>
            {'Copyright © Motion Software '}
            {new Date().getFullYear()}
        </div>
    </footer>
)

export default Footer;
