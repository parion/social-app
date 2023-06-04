import React from 'react'
import {StyleSheet, TextInput} from 'react-native'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {AtUri} from '@atproto/api'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
// import {EmptyStateWithButton} from 'view/com/util/EmptyStateWithButton'
import {useStores} from 'state/index'
import {ListsListModel} from 'state/models/lists/lists-list'
// import {ListsList} from 'view/com/lists/ListsList'
import {Button} from 'view/com/util/forms/Button'
import {Text} from '../com/util/text/Text'
import {NavigationProp} from 'lib/routes/types'
import {usePalette} from 'lib/hooks/usePalette'
import {CenteredView} from 'view/com/util/Views'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {isDesktopWeb} from 'platform/detection'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMuteKeywords'
>
export const ModerationMuteKeywordsScreen = withAuthRequired(({}: Props) => {
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  const mutelists: ListsListModel = React.useMemo(
    () => new ListsListModel(store, 'my-modlists'),
    [store],
  )

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
      mutelists.refresh()
    }, [store, mutelists]),
  )

  const onPressNewMuteList = React.useCallback(() => {
    store.shell.openModal({
      name: 'create-or-edit-mute-list',
      onSave: (uri: string) => {
        try {
          const urip = new AtUri(uri)
          navigation.navigate('ProfileList', {
            name: urip.hostname,
            rkey: urip.rkey,
          })
        } catch {}
      },
    })
  }, [store, navigation])

  // const renderEmptyState = React.useCallback(() => {
  //   return (
  //     <EmptyStateWithButton
  //       testID="emptyMuteLists"
  //       icon="users-slash"
  //       message="You can subscribe to mute lists to automatically mute all of the users they include. Mute lists are public but your subscription to a mute list is private."
  //       buttonLabel="New Mute List"
  //       onPress={onPressNewMuteList}
  //     />
  //   )
  // }, [onPressNewMuteList])

  const renderHeaderButton = React.useCallback(
    () => (
      <Button
        type="primary-light"
        onPress={onPressNewMuteList}
        style={styles.createBtn}>
        <FontAwesomeIcon
          icon="plus"
          style={pal.link as FontAwesomeIconStyle}
          size={18}
        />
      </Button>
    ),
    [onPressNewMuteList, pal],
  )

  return (
    <CenteredView
      style={[
        styles.container,
        isDesktopWeb && styles.containerDesktop,
        pal.view,
        pal.border,
      ]}
      testID="moderationMuteKeywordsScreen">
      <ViewHeader
        title="Mute Keywords"
        showOnDesktop
        renderButton={renderHeaderButton}
      />
      <Text type="sm" style={[pal.text]}>
        Posts and replies containing muted keywords are removed from your feed,
        notifications, and search results. Muted keywords are completely
        private.
      </Text>
      <Text type="sm" style={[pal.text]}>
        Enter one word at a time, excluding spaces and special characters.
      </Text>
      <TextInput
        style={[pal.text]}
        placeholder="Add a keyword"
        accessibilityLabel="Mute keyword input"
        accessibilityHint="Enter an alphanumeric keyword to mute"
      />
      {/* <ListsList
        listsList={mutelists}
        showAddBtns={isDesktopWeb}
        renderEmptyState={renderEmptyState}
        onPressCreateNew={onPressNewMuteList}
      /> */}
    </CenteredView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  createBtn: {
    width: 40,
  },
})
