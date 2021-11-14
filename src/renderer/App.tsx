import React from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';

import './App.global.css';

import Home from './views/Home';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" render={() => <Home />} />
      </Switch>
    </Router>
  );
}
