import {Constants, React, StyleSheet} from "enmity/metro/common"
import {FormRow, Text, View} from "enmity/components"
import {getByName} from "enmity/metro"
import {toHex} from "../utils/color"
import {getIDByName} from "enmity/api/assets"
import {getByProps} from "enmity/modules";

const LazyActionSheet = getByProps("openLazy", "hideActionSheet")
const CustomColorPickerActionSheet = getByName("CustomColorPickerActionSheet", {default: false}).default

function ColorPicker({label, color, setColor, leading, onSelect = undefined}) {
    const styles = StyleSheet.createThemedStyleSheet({
        pickedColorText: {
            color: Constants.ThemeColorMap.TEXT_NORMAL,
            marginLeft: 10,
            fontSize: 16,
            width: 72,
            fontFamily: Constants.Fonts.PRIMARY_MEDIUM
        },
        pickerColorPreview: {
            width: 24,
            height: 24,
            backgroundColor: toHex(color),
            borderRadius: 3,
            borderWidth: 1,
            borderColor: Constants.ThemeColorMap.HEADER_SECONDARY
        }
    })
    return (
        <FormRow
            label={label}
            trailing={
                <View style={{
                    flexDirection: "row",
                    alignItems: 'center'
                }}>
                    <View style={styles.pickerColorPreview}/>
                    <Text style={styles.pickedColorText}>
                        {toHex(color)}
                    </Text>
                    <FormRow.Arrow/>
                </View>
            }
            leading={<FormRow.Icon source={getIDByName(leading)} style={{tintColor: toHex(color)}}/>}
            onPress={() => {
                // *** work on 162- ***
                // Navigation.push(() => {
                //     return (
                //         <CustomColorPickerActionSheet color={color} onSelect={(newColor) => {
                //             setColor(newColor)
                //             if (onSelect) onSelect(newColor)
                //             Navigation.pop()
                //         }}/>
                //     )
                // })
                // *** work on all versions (theoretically) ***
                setTimeout(() => {
                    LazyActionSheet.openLazy(new Promise(resolve => resolve({default: CustomColorPickerActionSheet})), "CustomColorPickerActionSheet", {
                        color: color, onSelect: (newColor) => {
                            setColor(newColor)
                            if (onSelect) onSelect(newColor)
                            LazyActionSheet.hideActionSheet()
                        }
                    })
                }, 300)
            }}
        />
    )
}

export {ColorPicker}