import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name} from '../manifest.json'
import Settings from "./components/Settings"
import {getByName} from "enmity/metro"
import {View, Image, Pressable} from "enmity/components";
import {findInReactTree} from "enmity/utilities";
import {getIDByName} from "enmity/api/assets";
import {getByProps} from "enmity/modules";

const Patcher = create('BetterStatusIndicator')

const PresenceStore = getByProps("setCurrentUserOnConnectionOpen")
const ProfileBadges = getByName("ProfileBadges", {all: true, default: false})

const mobileIcon = getIDByName("ic_mobile_status") // ic_mobile_device _status StatusMobileOnline
const desktopIcon = getIDByName("ic_monitor_24px") // ic_monitor
const webIcon = getIDByName("ic_public")

function getStatusColor(stat) {
    let color = "#747f8d" // offline
    if (stat == "online") color = "#3ba55c"
    else if (stat == "idle") color = "#faa61a"
    else if (stat == "dnd") color = "#ed4245"
    else if (stat == "streaming") color = "#593695"
    return color
}

function Indicator({client, stat}) {
    let source = webIcon
    let styles
    if (client == "desktop") {
        source = desktopIcon
        styles = {}
    } else if (client == "mobile") {
        source = mobileIcon
        styles = {
            marginRight: 5,
            marginLeft: 8
        }
    } else if (client == "web") {
        styles = {
            height: 20,
            width: 20,
            marginRight: 2,
            marginLeft: 2
        }
    }
    return (
        <Image
            source={source}
            style={{
                tintColor: getStatusColor(stat),
                marginLeft: 5,
                ...styles
            }}
        />
    )
}

function Statuses({statuses}) {
    return <View style={{
        flexDirection: "row", // 中身を横方向に並べる
        marginRight: 10,
        alignItems: 'center' // 縦方向を揃える
    }}>
        {...statuses}
    </View>
}

const BetterStatusIndicator: Plugin = {
    ...manifest,
    onStart() {
        // フレンドリスト
        Patcher.after(Pressable.type, 'render', (self, args, res) => {
            // const user = findInReactTree(res, r => r.props?.accessibilityActions[1].name === "call" && r.props?.accessibilityActions[2].name === "message")
            const user = findInReactTree(res, r => r.props?.children[0][1].type.name == "FriendPresence")
            if (user) {
                let statuses = []
                const userId = user.props.children[0][1].props.userId
                const stat = PresenceStore.getState().clientStatuses[userId]
                if (stat) {
                    if (stat.desktop) statuses.unshift(<Indicator client="desktop" stat={stat.desktop}/>)
                    if (stat.mobile) statuses.unshift(<Indicator client="mobile" stat={stat.mobile}/>)
                    if (stat.web) statuses.unshift(<Indicator client="web" stat={stat.web}/>)
                    if (statuses.length) {
                        res.props.children[0].splice(-1, 0, <Statuses statuses={statuses}/>)
                    }
                }
            }
        })

        // メンバーリスト
        const viewPatch = Patcher.after(View, "render", (self, args, res) => {
            const member = findInReactTree(res, r => r.props["type"] === "MEMBER")
            if (member) {
                Patcher.after(member.type, "type", (self, [props], res) => {
                    const stat = PresenceStore.getState().clientStatuses[props.userId]
                    if (stat) {
                        if (stat.web) res.props.children.push(<Indicator client="web" stat={stat.web}/>)
                        if (stat.mobile) res.props.children.push(<Indicator client="mobile" stat={stat.mobile}/>)
                        if (stat.desktop) res.props.children.push(<Indicator client="desktop" stat={stat.desktop}/>)
                    }
                })
                viewPatch()
            }
        })

        // ユーザープロフィール
        ProfileBadges.forEach(profileBadge => {
            Patcher.after(profileBadge, "default", (self, [props], res) => {
                let statuses = []
                const stat = PresenceStore.getState().clientStatuses[props.user.id]
                if (stat) {
                    if (stat.desktop) statuses.unshift(<Indicator client="desktop" stat={stat.desktop}/>)
                    if (stat.mobile) statuses.unshift(<Indicator client="mobile" stat={stat.mobile}/>)
                    if (stat.web) statuses.unshift(<Indicator client="web" stat={stat.web}/>)
                    if (statuses.length) {
                        if (res) {
                            let destination = res.props.badges ? res.props.badges : res.props.children
                            destination.unshift(...statuses)
                        } else {
                            return <Statuses statuses={statuses}/>
                        }
                    }
                }
            })
        })
    },
    onStop() {
        Patcher.unpatchAll()
    },
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(BetterStatusIndicator)
