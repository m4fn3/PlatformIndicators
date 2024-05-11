import { FormRow, FormSection, View, ScrollView, Image, Text, FormSwitch } from 'enmity/components'
import { Constants, Navigation, React, StyleSheet } from 'enmity/metro/common'
import { Linking } from "enmity/metro/common"
// @ts-ignore
import { name as plugin_name, version } from '../../manifest.json'
import { getIDByName } from "enmity/api/assets"
import { getByProps } from "enmity/modules"
import { ColorPicker } from "./ColorPicker"
import { get, set } from "enmity/api/settings"

const GitHubIcon = getIDByName('img_account_sync_github_white')
const DiscordIcon = getIDByName('Discord')
const TwitterIcon = getIDByName('img_account_sync_twitter_white')
const ReloadIcon = getIDByName('ic_message_retry')
const MemberIcon = getIDByName('ic_members')
const FriendIcon = getIDByName('ic_friend_wave_24px')
const ProfileIcon = getIDByName('ic_profile_24px')
const DMIcon = getIDByName('ic_mail')
const MobileIcon = getIDByName('mobile')

const Invites = getByProps('acceptInviteAndTransitionToInviteChannel')


export default ({ settings }) => {
    const styles = StyleSheet.createThemedStyleSheet({
        container: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center"
        },
        image: {
            width: 70,
            height: 70,
            marginTop: 20,
            marginLeft: 20
        },
        title: {
            flexDirection: "column",
        },
        name: {
            fontSize: 25,
            paddingTop: 20,
            paddingLeft: 20,
            paddingRight: 30,
            color: Constants.ThemeColorMap.HEADER_PRIMARY,
            fontFamily: Constants.Fonts.PRIMARY_MEDIUM
        },
        author: {
            fontSize: 15,
            paddingLeft: 50,
            color: Constants.ThemeColorMap.HEADER_SECONDARY,
        },
        info: {
            height: 45,
            paddingTop: 3,
            paddingBottom: 3,
            justifyContent: "center",
            alignItems: "center"
        },
        footer: {
            color: Constants.ThemeColorMap.HEADER_SECONDARY,
            textAlign: 'center',
            paddingTop: 10,
            paddingBottom: 20
        }
    })

    const [onlineColor, setOnlineColor] = React.useState(get(plugin_name, "online", 3908956))
    const [offlineColor, setOfflineColor] = React.useState(get(plugin_name, "offline", 7634829))
    const [idleColor, setIdleColor] = React.useState(get(plugin_name, "idle", 16426522))
    const [dndColor, setDndColor] = React.useState(get(plugin_name, "dnd", 15548997))
    const [streamingColor, setStreamingColor] = React.useState(get(plugin_name, "streaming", 5846677))

    return (
        <ScrollView>
            <View style={styles.container}>
                <Image
                    source={{ uri: 'https://avatars.githubusercontent.com/u/43488869' }}
                    style={styles.image}
                />
                <View style={styles.title}>
                    <Text style={styles.name}>BetterStatusIndicator</Text>
                    <Text style={styles.author}>by mafu</Text>
                </View>
            </View>
            <FormSection title="COLOR">
                <ColorPicker label="Online" color={onlineColor} setColor={setOnlineColor} leading="StatusOnline" onSelect={(newColor) => {
                    set(plugin_name, "online", newColor)
                }} />
                <ColorPicker label="Offline" color={offlineColor} setColor={setOfflineColor} leading="StatusOffline" onSelect={(newColor) => {
                    set(plugin_name, "offline", newColor)
                }} />
                <ColorPicker label="Idle" color={idleColor} setColor={setIdleColor} leading="StatusIdle" onSelect={(newColor) => {
                    set(plugin_name, "idle", newColor)
                }} />
                <ColorPicker label="DND" color={dndColor} setColor={setDndColor} leading="StatusDND" onSelect={(newColor) => {
                    set(plugin_name, "dnd", newColor)
                }} />
                <ColorPicker label="Streaming" color={streamingColor} setColor={setStreamingColor} leading="StatusStreaming" onSelect={(newColor) => {
                    set(plugin_name, "streaming", newColor)
                }} />
                <FormRow
                    label="Reset to default"
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={ReloadIcon} />}
                    onPress={() => {
                        set(plugin_name, "offline", 7634829)
                        setOfflineColor(7634829)
                        set(plugin_name, "online", 3908956)
                        setOnlineColor(3908956)
                        set(plugin_name, "idle", 16426522)
                        setIdleColor(16426522)
                        set(plugin_name, "dnd", 15548997)
                        setDndColor(15548997)
                        set(plugin_name, "streaming", 5846677)
                        setStreamingColor(5846677)
                    }}
                />
                <FormRow
                    label="Colorize Mobile Icons"
                    leading={<FormRow.Icon source={MobileIcon} />}
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("coloredMobile", true)}
                            onValueChange={(value) => {
                                settings.set("coloredMobile", value)
                            }}
                        />
                    }
                />
            </FormSection>
            <FormSection title="PLACE">
                <FormRow
                    label="Member List"
                    leading={<FormRow.Icon source={MemberIcon} />}
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("member", true)}
                            onValueChange={(value) => {
                                settings.set("member", value)
                            }}
                        />
                    }
                />
                <FormRow
                    label="Friends Tab"
                    leading={<FormRow.Icon source={FriendIcon} />}
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("friend", true)}
                            onValueChange={(value) => {
                                settings.set("friend", value)
                            }}
                        />
                    }
                />
                <FormRow
                    label="Profile"
                    leading={<FormRow.Icon source={ProfileIcon} />}
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("profile", true)}
                            onValueChange={(value) => {
                                settings.set("profile", value)
                            }}
                        />
                    }
                />
                <FormRow
                    label="DM"
                    leading={<FormRow.Icon source={DMIcon} />}
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("dm", true)}
                            onValueChange={(value) => {
                                settings.set("dm", value)
                            }}
                        />
                    }
                />
            </FormSection>
            <FormSection title="INFORMATION">
                <FormRow
                    label="Follow me on Twitter"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={TwitterIcon} />}
                    onPress={() => {
                        Linking.openURL("https://twitter.com/m4fn3")
                    }}
                />
                <FormRow
                    label="Visit my server for help"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={DiscordIcon} />}
                    onPress={() => {
                        Invites.acceptInviteAndTransitionToInviteChannel({
                            inviteKey: 'TrCqPTCrdq',
                            context: { location: 'Invite Button Embed' },
                            callback: () => {
                                Navigation.pop()
                            }
                        })
                    }}
                />
                <FormRow
                    label="Check Source on GitHub"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={GitHubIcon} />}
                    onPress={() => {
                        Linking.openURL("https://github.com/m4fn3/BetterStatusIndicator")
                    }}
                />
            </FormSection>
            <Text style={styles.footer}>
                {`v${version}`}
            </Text>
        </ScrollView>
    )
};