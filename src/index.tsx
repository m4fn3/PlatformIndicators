import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {Navigation, React} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name, name} from '../manifest.json'
import Settings from "./components/Settings"
import {getByName, getModule} from "enmity/metro"
import {View, Image, Pressable} from "enmity/components"
import {findInReactTree} from "enmity/utilities"
import {getIDByName} from "enmity/api/assets"
import {getByProps} from "enmity/modules"
import {toHex} from "./utils/color"
import {get} from "enmity/api/settings"

const Patcher = create('BetterStatusIndicator')

const PresenceStore = getByProps("setCurrentUserOnConnectionOpen")
const ProfileBadges = getByName("ProfileBadges", {all: true, default: false})
const Status = getByName("Status", {default: false})

const mobileIcon = getIDByName("ic_mobile_status") // ic_mobile_device _status StatusMobileOnline
const desktopIcon = getIDByName("ic_monitor_24px") // ic_monitor
const webIcon = getIDByName("ic_public")

function getStatusColor(stat) {
    let color = toHex(get(plugin_name, "offline", 7634829)) // #747f8d
    if (stat == "online") color = toHex(get(plugin_name, "online", 3908956)) // #3ba55c
    else if (stat == "idle") color = toHex(get(plugin_name, "idle", 16426522)) // #faa61a
    else if (stat == "dnd") color = toHex(get(plugin_name, "dnd", 15548997)) // #ed4245
    else if (stat == "streaming") color = toHex(get(plugin_name, "streaming", 5846677)) // #593695
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
        // ステータス
        Patcher.after(Status, "default", (self, [props], res) => {
            res.props.children.props.style.tintColor = getStatusColor(props.status)
        })

        // フレンドリスト
        Patcher.after(Pressable.type, 'render', (self, args, res) => {
            if (get(plugin_name, "friend", true)) {
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
            }
        })

        // メンバーリスト
        const viewPatch = Patcher.after(View, "render", (self, args, res) => {
            if (get(plugin_name, "member", true)) {
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
            }
        })

        // ユーザープロフィール
        ProfileBadges.forEach(profileBadge => {
            Patcher.after(profileBadge, "default", (self, [props], res) => {
                if (get(plugin_name, "profile", true)) {
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
                }
            })
        })
    },
    onStop() {
        Patcher.unpatchAll()
    }
    ,
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(BetterStatusIndicator)
