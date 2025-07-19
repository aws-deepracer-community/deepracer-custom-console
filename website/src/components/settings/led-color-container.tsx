import { useEffect, useState } from "react";
import Circle from "@uiw/react-color-circle";
import { Container, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";
import { getColorRgb } from "./validation-utils";

interface LedColorResponse {
  success: boolean;
  red?: number;
  green?: number;
  blue?: number;
}

export const LedColorContainer = () => {
  const [hex, setHex] = useState("#000000");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setLedColor = async (color: any) => {
    const setled = await ApiHelper.post<LedColorResponse>("set_led_color", {
      red: color.rgb.r,
      green: color.rgb.g,
      blue: color.rgb.b,
    });
    if (setled && setled.success) {
      console.log("Set led color:", setled);
    }
  };
  const turnOffLed = async () => {
    const ledoff = await ApiHelper.post<LedColorResponse>("set_led_color", {
      red: 0,
      green: 0,
      blue: 0,
    });
    setHex("#000000");
    if (ledoff && ledoff.success) {
      console.log("Set led color off:", ledoff);
    }
  };

  useEffect(() => {
    const fetchLedData = async () => {
      // must be in calibration mode to get led color
      const setCalibration = await ApiHelper.get<{ success: boolean }>("set_calibration_mode");
      if (setCalibration && setCalibration.success) {
        //console.log('Set calibration:', setCalibration);
        const ledData = await ApiHelper.get<LedColorResponse>("get_led_color");
        if (ledData && ledData.success) {
          const hexFromRgb = getColorRgb({ r: ledData.red!, g: ledData.green!, b: ledData.blue! });
          //console.log(ledData)
          setHex(hexFromRgb);
          // console.log(hexFromRgb)
        }
      }
    };

    fetchLedData();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => turnOffLed()}>Turn Off LED</Button>
            </SpaceBetween>
          }
        >
          LED colour
        </Header>
      }
    >
      <Circle
        colors={[
          "#0000FF",
          "#1E8FFF",
          "#800080",
          "#673ab7",
          "#FF00FF",
          "#e91e63",
          "#FF0090",
          "#FF0000",
          "#FF8200",
          "#FFFF00",
          "#00FF00",
          "#417505",
          "#FFFFFF",
        ]}
        color={hex}
        pointProps={{
          style: {
            marginRight: 20,
          },
        }}
        onChange={(color) => {
          setHex(color.hex);
          setLedColor(color);
          console.log(color.rgb);
          console.log(color.hex);
        }}
      />
    </Container>
  );
};
