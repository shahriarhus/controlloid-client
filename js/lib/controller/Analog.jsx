import React from "react";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { SvgXml } from "react-native-svg";
import { Animated, View } from "react-native";
import * as Types from "../../types";
import { TouchReceiverMixin } from "../utils";
import Styles, { buildContainerStyle } from "./styles";

export default class Analog extends TouchReceiverMixin(React.PureComponent) {
  static getDerivedStateFromProps({ x, y, size }, { centerX, centerY, halfSize }) {
    if (halfSize !== size / 2 || x + size / 2 !== centerX || y + size / 2 !== centerY) {
      return {
        centerX: x + size / 2,
        centerY: y + size / 2,
        halfSize: size / 2,
      };
    }
    return null;
  }

  constructor(props) {
    super(props);
    this.state = {
      centerX: 0,
      centerY: 0,
      halfSize: 0,
    };
    this.touchId = null;
    this.translation = new Animated.ValueXY();
  }

  analogMove(position) {
    const { centerX, centerY, halfSize } = this.state;
    const { dispatch, emitX, emitY, analogDeadZone, analogStickMax } = this.props;
    const clampedPosition = {
      x: Math.min(halfSize, Math.max(-halfSize, position.x - centerX)),
      y: Math.min(halfSize, Math.max(-halfSize, position.y - centerY)),
    };
    if (
      Math.abs(clampedPosition.x) >= (analogDeadZone / 100) * halfSize ||
      Math.abs(clampedPosition.y) >= (analogDeadZone / 100) * halfSize
    ) {
      if (
        clampedPosition.x !== this.translation.x._value ||
        clampedPosition.y !== this.translation.y._value
      ) {
        dispatch(
          {
            [emitX]: Math.round((clampedPosition.x / halfSize) * analogStickMax),
            [emitY]: Math.round((clampedPosition.y / halfSize) * analogStickMax),
          },
          false,
        );
        this.translation.setValue(clampedPosition);
      }
    } else {
      this.analogReset();
    }
  }

  analogReset() {
    const { dispatch, emitX, emitY } = this.props;
    if (this.translation.x._value !== 0 || this.translation.y._value !== 0) {
      dispatch(
        {
          [emitX]: 0,
          [emitY]: 0,
        },
        true,
      );
      this.translation.setValue({
        x: 0,
        y: 0,
      });
    }
  }

  onTouchDown(id) {
    if (this.touchId === null) {
      this.touchId = id;
      this.analogReset();
      return true;
    }
    return false;
  }

  onTouchMove(touch) {
    if (this.touchId === touch.identifier) {
      this.analogMove({
        x: touch.locationX,
        y: touch.locationY,
      });
      return true;
    }
    return false;
  }

  onTouchUp(id) {
    if (this.touchId === id) {
      this.touchId = null;
      this.analogReset();
    }
  }

  render() {
    const { x, y, size, theme, stickerIcon, style, ...viewProps } = this.props;
    const knobSize = size * 0.75;
    return (
      <Animated.View {...viewProps} style={[buildContainerStyle(x, y, size), style]}>
        <View style={Styles.overlayContainer}>
          <SvgXml xml={theme.pad} width={size} height={size} />
        </View>
        <Animated.View style={{ transform: this.translation.getTranslateTransform() }}>
          <SvgXml xml={theme.knob} width={knobSize} height={knobSize} />
          <View style={Styles.overlayContainer}>
            <MaterialIcon name={stickerIcon} size={knobSize * 0.5} />
          </View>
        </Animated.View>
      </Animated.View>
    );
  }
}

Analog.propTypes = {
  x: Types.number.isRequired,
  y: Types.number.isRequired,
  size: Types.number.isRequired,
  emitX: Types.string.isRequired,
  emitY: Types.string.isRequired,
  theme: Types.controllerTheme.isRequired,
  style: Types.any,
  dispatch: Types.func,
  stickerIcon: Types.string,
  analogDeadZone: Types.number,
  analogStickMax: Types.number,
};

Analog.defaultProps = {
  dispatch: () => null,
  stickerIcon: "star-three-points",
  analogDeadZone: 33,
  analogStickMax: 32767,
};
