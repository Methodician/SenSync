import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ActivatedRoute } from '@angular/router';
import {
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
  SeriesOption,
} from 'echarts';
import { combineLatest, first, map } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

const baseChatOption: EChartsOption = {
  // toolbox: {
  //   right: 20,
  //   feature: {
  //     dataZoom: {
  //       yAxisIndex: 'none',
  //     },
  //     saveAsImage: {},
  //     restore: {},
  //     magicType: {},
  //   },
  // },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },
  legend: {},
  xAxis: {
    type: 'time',
    axisLabel: {
      formatter: function (value: number) {
        let date = new Date(value);
        if (date.getHours() === 0) {
          return date.toLocaleDateString();
        }

        return date.toLocaleTimeString();
      },
    },
  },
  yAxis: {
    type: 'value',
    name: 'y axis',
    min: 12,
  },
  series: [],
  dataZoom: [
    {
      startValue: new Date().setHours(0),
    },
    { type: 'inside' },
  ],
};

@Component({
  selector: 'sen-module-overview',
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.scss'],
})
export class ModuleOverviewComponent {
  //! querying is sooo bad with rtdb maybe I really should just go with firestore
  chartOption: EChartsOption = baseChatOption;
  updateOption: EChartsOption;

  constructor(
    private activeRoute: ActivatedRoute,
    private db: AngularFireDatabase,
  ) {
    this.initializeChart();
  }

  initializeChart = () => {
    this.activeRoute.params
      .pipe(
        map(params => params['id']),
        first(id => !!id),
      )
      .subscribe(id => {
        const module$ = this.db.object<ModuleI>(`modules/${id}`).valueChanges();
        const readouts$ = this.db
          .list<ReadoutI>('readouts', ref =>
            ref.orderByChild('moduleId').equalTo(id),
          )
          .valueChanges();
        combineLatest([module$, readouts$]).subscribe(([module, readouts]) => {
          if (!readouts) {
            return;
          }
          const xAxis: XAXisComponentOption = {
            type: 'time',
            alignTicks: true,
            axisLabel: {
              formatter: function (value: number) {
                let date = new Date(value);
                if (date.getHours() === 0) {
                  return date.toLocaleDateString();
                }

                return date.toLocaleTimeString();
              },
            },
          };
          const humidity = readouts.map(readout => [
            readout.timestamp,
            readout.bme.humidity,
          ]);
          const temperature = readouts.map(readout => [
            readout.timestamp,
            readout.bme.temperature,
          ]);
          const yAxisHumidity: YAXisComponentOption = {
            type: 'value',
            name: 'Humidity',
          };
          const yAxisTemperature: YAXisComponentOption = {
            name: 'Temperature',
            alignTicks: true,
            type: 'value',
          };
          const yAxis: YAXisComponentOption[] = [
            yAxisHumidity,
            yAxisTemperature,
          ];
          const humiditySeries: SeriesOption = {
            name: 'Humidity',
            type: 'line',
            data: humidity,
          };
          const temperatureSeries: SeriesOption = {
            name: 'Temperature',
            type: 'line',
            data: temperature,
            yAxisIndex: 1,
          };
          const series: SeriesOption[] = [humiditySeries, temperatureSeries];
          const chartOption: EChartsOption = {
            title: {
              text: `${module?.name} - Humidity vs Temperature`,
              left: 'center',
              top: 20,
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'cross',
              },
            },
            yAxis,
            xAxis,
            series,
          };
          this.updateOption = chartOption;
        });
      });
  };
}
