import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  faThumbsUp,
  faThumbsDown,
  faFaceSmile,
  faFaceFrown,
} from '@fortawesome/free-solid-svg-icons';
import { WeatherService } from '../Services/weather.service';

@Component({
  selector: 'app-right-container',
  templateUrl: './right-container.component.html',
  styleUrls: ['./right-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RightContainerComponent {
  faThumbsUp = faThumbsUp;
  faThumbsDown = faThumbsDown;
  faFaceSmile = faFaceSmile;
  faFaceFrown = faFaceFrown;

  constructor(public weatherService: WeatherService) {}
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.weatherService.cityName = 'Paris';
    this.weatherService.getData();
  }

  onTodayClick(): void {
    this.weatherService.today = true;
    this.weatherService.week = false;
  }

  onWeekClick(): void {
    this.weatherService.week = true;
    this.weatherService.today = false;
  }

  onCelsiusClick(): void {
    this.weatherService.celsius = true;
    this.weatherService.fahrenheit = false;
  }

  onFahrenheitClick(): void {
    this.weatherService.fahrenheit = true;
    this.weatherService.celsius = false;
  }
}
