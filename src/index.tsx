import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {Locale, React, Toasts} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name, name} from '../manifest.json'
import Settings from "./components/Settings"
import {getByName} from "enmity/metro"
import {View, Image, Pressable, TouchableOpacity} from "enmity/components"
import {findInReactTree} from "enmity/utilities"
import {getIDByName} from "enmity/api/assets"
import {getByProps} from "enmity/modules"
import {toHex} from "./utils/color"
import {get} from "enmity/api/settings"
import {build} from "enmity/api/native"

const Patcher = create('BetterStatusIndicator')

const PresenceStore = getByProps("setCurrentUserOnConnectionOpen")
let ProfileBadges = getByName("ProfileBadges", {all: true, default: false})
const NewProfileBadges = getByProps("ProfileBadgesOld")

const Status = getByName("Status", {default: false})
const ChatSidebarMembers = getByName("ChatSidebarMembers", {default: false})

const mobileIcon = getIDByName("ic_mobile_status") // ic_mobile_device _status StatusMobileOnline
const desktopIcon = getIDByName("ic_monitor_24px") // ic_monitor
const webIcon = getIDByName("ic_public")
const botIcon = getIDByName("ic_robot_24px")

function getStatusColor(stat) {
    let color = toHex(get(plugin_name, "offline", 7634829)) // #747f8d
    if (stat == "online") color = toHex(get(plugin_name, "online", 3908956)) // #3ba55c
    else if (stat == "idle") color = toHex(get(plugin_name, "idle", 16426522)) // #faa61a
    else if (stat == "dnd") color = toHex(get(plugin_name, "dnd", 15548997)) // #ed4245
    else if (stat == "streaming") color = toHex(get(plugin_name, "streaming", 5846677)) // #593695
    return color
}

function getStatusIcon(stat) {
    let icon_name = "StatusOffline"
    if (stat == "online") icon_name = "StatusOnline"
    else if (stat == "idle") icon_name = "StatusIdle"
    else if (stat == "dnd") icon_name = "StatusDND"
    else if (stat == "streaming") icon_name = "StatusStreaming"
    return getIDByName(icon_name)
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
    } else if (client == "bot") {
        source = botIcon
        styles = {}
    }
    return (
        <TouchableOpacity
            onPress={() => Toasts.open({
                content: `${stat} (${client.charAt(0).toUpperCase()}${client.slice(1)})`,
                source: getStatusIcon(stat)
            })}
        >
            <Image
                source={source}
                style={{
                    tintColor: getStatusColor(stat),
                    marginLeft: 5,
                    ...styles
                }}
            />
        </TouchableOpacity>
    )
}

function Statuses({userId, isBot = false, customStyle = {}}) {
    const stat = PresenceStore.getState().clientStatuses[userId]
    let statuses = []
    if (stat) {
        if (isBot) {
            statuses.unshift(<Indicator client="bot" stat={stat.web}/>)
        } else {
            if (stat.desktop) statuses.unshift(<Indicator client="desktop" stat={stat.desktop}/>)
            if (stat.mobile) statuses.unshift(<Indicator client="mobile" stat={stat.mobile}/>)
            if (stat.web) statuses.unshift(<Indicator client="web" stat={stat.web}/>)
        }
    }
    return <View style={[{
        flexDirection: "row", // 中身を横方向に並べる
        alignItems: 'center' // 縦方向を揃える
    }, customStyle]}>
        {...statuses}
    </View>
}

const BetterStatusIndicator: Plugin = {
    ...manifest,
    onStart() {
        // ステータス色
        Patcher.after(Status, "default", (self, [props], res) => {
            res.props.children.props.style.tintColor = props.streaming ? getStatusColor("streaming") : getStatusColor(props.status)
        })

        // DMリスト/フレンドリスト
        Patcher.after(Pressable.type, 'render', (self, args, res) => {
            if (get(plugin_name, "friend", true)) {
                const user = findInReactTree(res, r => r.props?.children[0][1].type.name == "FriendPresence")
                if (user) {
                    const userId = user.props.children[0][1].props.userId
                    res.props.children[0].splice(-1, 0, <Statuses userId={userId} customStyle={{marginRight: 5}}/>)
                }
            }
            if (get(plugin_name, "dm", true)) {
                const dmLabelText = Locale.Messages.DIRECT_MESSAGE_A11Y_LABEL.message.split("(")[1].replace(")", "")
                const dm = findInReactTree(res, r => r.props?.accessibilityLabel?.includes(dmLabelText))
                if (dm) {
                    let user = dm.props?.children[0][0]?.props?.user
                    if (user) dm.props.children.push(<Statuses userId={user.id} isBot={user.bot}/>)
                }
            }
        })

        // 没コード集
        // 1. ConnectedPrivateChannels -> PrivateChannels -> この次renderXXXを全てフックしても出てこないため断念/PrivateChannel自体も取得できない
        // 2. FastListのrenderから攻める -> PrivateChannelにいけたけどその先が無理
        // const FastList = getByName("FastList", {default: false})
        // Patcher.after(FastList, 'default', (self, args, res) => {
        //     if (res.props.accessibilityLabel === "ダイレクトメッセージ") {
        //         Patcher.after(res.props, 'renderItem', (self, args, res) => {
        //             Patcher.after(res.type, 'type', (self, args, res) => {
        //                 if (res.type.name === "PrivateChannel") { // たどり着いたけど...?
        //                     Patcher.after(res, 'type', (self, args, res) => {
        //                         console.log("----------")
        //                         console.log(res)
        //                     })
        //                 }
        //             })
        //         })
        //     }
        // })


        // サーバーのメンバーリスト // ChatSidebarMembersGuildConnected
        const viewPatch = Patcher.after(View, "render", (self, args, res) => {
            if (get(plugin_name, "member", true)) {
                const member = findInReactTree(res, r => r.props["type"] === "MEMBER")
                if (member) {
                    Patcher.after(member.type, "type", (self, [props], res) => {
                        if (get(plugin_name, "member", true)) {
                            if (res.props.children.length === 3) {
                                res.props.children.push(<Statuses userId={props.userId} isBot={props.user.bot}/>)
                            }
                        }
                    })
                    viewPatch()
                }
            }
        })

        // DMおよびグループDMのメンバーリスト // tested on 180.0(44225)
        const unpatchChatSidebarMembers = Patcher.after(ChatSidebarMembers, 'default', (self, args, res) => { // ChatSidebarMembers
            if (res.type.name === "ChatSidebarMembersPrivateChannel") {
                const unpatchCSMPC = Patcher.after(res, 'type', (self, args, res) => { // ChatSidebarMembersPrivateChannel
                    const unpatchFL = Patcher.after(res.props, 'renderItem', (self, args, res) => { // FastList
                        // NOTE: activities等の属性でViewパッチをしてもでてこないためしゃーなし
                        const unpatchM = Patcher.after(res.type, "type", (self, args, res) => { // Member
                            Patcher.after(res.type, "type", (self, [props], res) => {
                                if (res.props.children.length === 3) {
                                    res.props.children.push(<Statuses userId={props.user.id} isBot={props.user.bot}/>)
                                }
                            })
                        })
                    })
                })
                // } else if (res.type.name === "ChatSidebarMembersThreadChannel") {
                //     const unpatchCSMTC = Patcher.after(res, 'type', (self, args, res) => { // ChatSidebarMemberThreadChannel
                //         const unpatchCSTM = Patcher.after(res, 'type', (self, args, res) => { // ChatSidebarThreadMembers
                //             const unpatchCSTM2 = Patcher.after(res, 'type', (self, args, res) => { // ChatSidebarThreadMembers <- wtf
                //                 const unpatchFL = Patcher.after(res.props, 'renderItem', (self, args, res) => { // FastList
                //                     const unpatchTM = Patcher.after(res, "type", (self, args, res) => { // ThreadMember
                //                         const unpatchM = Patcher.after(res.type, "type", (self, [props], res) => { // Member
                //                             // NOTE: Discord doesn't fetch presences of Thread members so PresenceStore returns undefined (maybe)
                //                             //       the same behavior is confirmed on Desktop (プロフィールを開けば表示される、手動で読み込めば使えるかも)
                //                             if (res.props.children.length === 3) {
                //                                 res.props.children.push(<Statuses userId={props.user.id} isBot={props.user.bot}/>)
                //                             }
                //                         })
                //                     })
                //                 })
                //             })
                //         })
                //     })
            }
        })

        // ユーザープロフィール
        if (NewProfileBadges && build >= "42235") {
            ProfileBadges = [NewProfileBadges]
        }
        ProfileBadges.forEach(profileBadge => {
            Patcher.after(profileBadge, "default", (self, [props], res) => {
                if (get(plugin_name, "profile", true)) {
                    let badgeStatusStyle = {marginLeft: 3, marginRight: 3}
                    if (res) {
                        let destination = res.props.badges ? res.props.badges : res.props.children
                        if (destination) {
                            destination.unshift(<Statuses userId={props.user.id} isBot={props.user.bot} customStyle={badgeStatusStyle}/>)
                        } else {
                            return <Statuses userId={props.user.id} isBot={props.user.bot} customStyle={badgeStatusStyle}/>
                        }
                    } else {
                        return <Statuses userId={props.user.id} isBot={props.user.bot} customStyle={badgeStatusStyle}/>
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
