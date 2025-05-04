declare module '@react-native-community/datetimepicker' {
  import { ViewProps } from 'react-native';

  interface DateTimePickerProps extends ViewProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange?: (event: any, selectedDate?: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    testID?: string;
  }

  const DateTimePicker: React.ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
} 