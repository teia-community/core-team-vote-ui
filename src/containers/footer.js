import React from 'react';
import { toggle_theme } from '../App';
import { Button } from './button';


export function Footer() {
    return (
        <footer>
            <p>
                Created by the <a href='https://twitter.com/TeiaCommunity'>@TeiaCommunity</a> using <a href='https://reactjs.org'>React</a>,
                {' '}
                <a href='https://tezostaquito.io'>Taquito</a>, and the <a href='https://tzkt.io'>TzKT</a> API.
            </p>
            <DarkToggle/>
        </footer>
    );
}

export function DarkToggle() {


    return (
        <div className='theme-toggle-container'>
            <Button text='darkMode' onClick={toggle_theme} />
        </div>
    );
}
