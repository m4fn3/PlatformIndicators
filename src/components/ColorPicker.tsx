import {Constants, Navigation, React, StyleSheet} from "enmity/metro/common"
import {FormRow, Text, View} from "enmity/components"
import {getByName} from "enmity/metro"
import {toHex} from "../utils/color"
import {getIDByName} from "enmity/api/assets"

const CustomColorPickerActionSheet = getByName("CustomColorPickerActionSheet", {default: false}).default

function ColorPicker({label, color, setColor, leading, onSelect=undefined}) {
    const styles = StyleSheet.createThemedStyleSheet({
        pickedColorText: {
            color: Constants.ThemeColorMap.TEXT_NORMAL,
            marginLeft: 10,
            fontSize: 16,
            width: 72
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
            leading={<FormRow.Icon source={getIDByName(leading)}/>}
            onPress={() => {
                Navigation.push(() => {
                    return <CustomColorPickerActionSheet color={color} onSelect={(newColor) => {
                        setColor(newColor)
                        if (onSelect) onSelect(newColor)
                        Navigation.pop()
                    }}/>
                })
            }}
        />
    )
}

export {ColorPicker}