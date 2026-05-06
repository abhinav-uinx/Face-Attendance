import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { dataset } from './basicDataset';
import style from './admindash.module.css';

export default function Admindash() {
  return (
    
    <div className={style.chartContainer}>
      <LineChart
        dataset={dataset}
        xAxis={[{ dataKey: 'x', scaleType: 'band', label: 'Months' }]}
        series={[{ dataKey: 'y', label: 'Values' }]}
        height={300}
        width={600}
        margin={{ left: 50, right: 30, top: 30, bottom: 50 }}
        grid={{ vertical: true, horizontal: true }}
      />
    </div>

  );
}



