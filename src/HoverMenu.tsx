import { Dropdown, Menu } from 'antd';
import React from 'react';

const menu = (
  <Menu
    
  />
);

const App: React.FC = () => (
  <Dropdown overlay={menu} trigger={['contextMenu']}>
    <div
      className="site-dropdown-context-menu"
      style={{
        textAlign: 'center',
        height: 200,
        lineHeight: '200px',
      }}
    >
      Right Click on here
    </div>
  </Dropdown>
);

export default App;