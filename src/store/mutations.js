import * as types from './mutationsTypes';
import Storage from "../assets/utils/Storage";
import ArrHelper from '../assets/utils/arrayHelper';
import Num from '../assets/utils/num';

export default {
  [types.SET_OPERATION](state, data) {
    state.operation = data;
  },
  [types.SET_USER](state, data) {
    state.user = data;
  },
  [types.UPDATE_SEARCH](state, data) {
    state.search = {
      ...state.search,
      ...data,
    }
  },
  [types.UPDATE_PLAYING_PERCENT](state, data) {
    state.playingPercent = data;
    state.downloading = false;
  },
  [types.QUERY_163_LIST](state, data) {
    const { allList } = state;
    const { songs = [], more = false, listId } = data;

    if (listId) {
      if (more) {
        allList[listId] = [ ...(allList[listId]), ...songs ];
      } else {
        allList[listId] = songs;
      }
      state.allList = { ...allList };
    }
  },
  [types.UPDATE_LIST](state, data) {
    const { allList } = state;
    const { songs = [], more = false, listId } = data;

    if (listId) {
      if (more) {
        allList[listId] = [ ...(allList[listId]), ...songs ];
      } else {
        allList[listId] = songs;
      }
      state.allList = { ...allList };
    }
  },
  [types.SET_USER_LIST](state, data) {
    state.userList = { ...state.userList, ...data };
  },
  [types.SET_RECOMMEND_LIST](state, data) {
    state.recommendList = { ...state.recommendList, ...data };
  },
  [types.CHANGE_SEARCH_QUERY](state, data) {
    state.searchQuery = { ...state.searchQuery, ...data };
  },
  [types.CHANGE_SHOW_COMMENT](state) {
    state.showComment = !state.showComment;
  },
  [types.UPDATE_SHOW_LIST](state, data) {
    if (data.more) {
      state.showList = [...state.showList, ...data.list];
    } else {
      state.showList = data.list;
    }
    data.dissid && (state.sysSongs[data.dissid] = state.showList);
  },
  [types.UPDATE_ALL_SONGS](state, data) {
    const { playNow = {}, playingList } = state;
    const { aId } = playNow;
    state.allSongs = { ...state.allSongs, ...data };
    if (aId && JSON.stringify(playNow) !== JSON.stringify(state.allSongs[aId])) {
      state.playNow = state.allSongs[aId];
    }
    if (ArrHelper.hasDuplicate(Object.keys(data), playingList.raw.join(',').split(','))) {
      playingList.trueList = playingList.raw.filter((aId) => state.allSongs[aId] && (state.allSongs[aId].pUrl));
      window.VUE_APP.$store.dispatch('updateRandomList');
    }
  },
  // 搜索歌曲
  [types.SEARCH_MUSIC](state, data) {
    const { search } = data;
    const { userList } = state;
    const { selected } = userList;
    let findList = selected.songs || [];
    const RE = new RegExp(search.replace(/\s/g, ''), 'i');
    state.showList = findList.filter((s) => (
      s.name.replace(/\s/g, '').match(RE) || s.ar.map((a) => a.name).join('').replace(/\s/g, '').match(RE) || s.al.name.replace(/\s/g, '').match(RE)
    ))
  },
  // 上一首
  [types.PLAY_PREV](state) {
    const {playingList, allSongs, playNow} = state;
    const {history, index, trueList, random} = playingList;
    const { aId } = playNow;
    const orderType = Storage.get('orderType');
    if (index > 0) {
      playingList.index -= 1;
      if (!history[playingList.index] || !allSongs[history[playingList.index]]) {
        return;
      }
      return state.playNow = allSongs[history[playingList.index]];
    }

    let i = 0;
    const list = orderType === 'suiji' ? random : trueList;
    i = list.indexOf(aId);
    i -= 1;
    if (i === -1) {
      i = list.length - 1;
    }
    if (!list[i] || !allSongs[list[i]]) {
      return;
    }
    state.playNow = allSongs[list[i]];
    state.playingList.history.unshift(state.playNow.aId);
  }
  ,
  // 下一首
  [types.PLAY_NEXT](state) {
    const { playingList, allSongs, playNow = {} } = state;
    const orderType = Storage.get('orderType');
    const { history, index, trueList, random } = playingList;
    const { aId } = playNow;
    playingList.index += 1;
    if (index < history.length - 1) {
      return state.playNow = allSongs[history[playingList.index]];
    }
    if (aId && playingList.history[playingList.history.length-1] !== aId) {
      playingList.history.push(aId);
    }

    let i = 0;
    if (trueList.length === 1) {
      window.VUE_APP.$message.info('还是这首！');
      window.pDom.play();
      return;
    }
    switch (orderType) {
      case 'suiji':
        i = random.indexOf(aId);
        i += 1;
        if (i === trueList.length) {
          i = 0;
        }
        if (i === (trueList.length - 1) || i === 0) {
          window.VUE_APP.$store.dispatch('updateRandomList');
        }
        if (!allSongs[random[i]]) {
          return;
        }
        return state.playNow = allSongs[random[i]];
      default:
        i = trueList.indexOf(aId);
        i += 1;
        if (i === trueList.length) {
          i = 0;
        }
        if (!allSongs[trueList[i]]) {
          return;
        }
        return state.playNow = allSongs[trueList[i]];
    }

  },
  // 更新随机播放历史
  [types.UPDATE_RANDOM_HISTORY](state, data) {
    state.randomHistory = data || {
      list: [],
      index: -1,
    };
  },
  // 更新播放器信息
  [types.UPDATE_PLAYER_INFO](state, data) {
    state.playerInfo = { ...state.playerInfo, ...data};
  },
  // loading状态
  [types.SET_DOWNLOADING](state, data) {
    state.downloading = data;
  },
  // 更新歌曲信息
  [types.UPDATE_SONG_DETAIL](state, data) {
    const { aId } = data;
    state.allSongs[aId] = {
      ...(state.allSongs[aId] || {}),
      ...data,
    };
    if (!state.playNow || aId === state.playNow.aId) {
      state.playNow = state.allSongs[aId];
    }
    state.allSongs = { ...state.allSongs };
    if (state.playingList.raw.indexOf(data) > -1) {
      state.playingList.trueList = state.playingList.raw.filter((aId) => state.allSongs[aId].pUrl);
      window.VUE_APP.$store.dispatch('updateRandomList');
    }
  },
  [types.UPDATE_PLAYING_STATUS](state, data) {
    state.playing = data;
  },
  // 更新正在播放的音乐
  [types.UPDATE_PLAY_NOW](state, data) {
    const { playingList, playNow } = state;
    if (!data || !data.aId) {
      return;
    }
    if (playNow.aId) {
      playingList.history.push(playNow.aId);
      playingList.index += 1;
    }
    state.playNow = data;
  },
  [types.UPDATE_PLAYING_LIST](state, { list, more, listId, heart = false }) {
    const { playingList, allSongs } = state;
    if (more) {
      // 增量
      playingList.raw = [ ...playingList.raw, ...list ];
    } else {
      // 非增量
      playingList.raw = list;
      playingList.history = [];
      playingList.index = 0;
    }
    state.isPersonFM = false;
    state.playingListId = listId;
    state.heartMode = heart;
    playingList.raw = ArrHelper.delDuplicate(playingList.raw);
    playingList.trueList = playingList.raw.filter((v) => allSongs[v] && (allSongs[v].pUrl));
    window.VUE_APP.$store.dispatch('updateRandomList');
  },
  [types.UPDATE_RANDOM_LIST](state) {
    const { playingList, playNow } = state;
    const arr = [ ...playingList.trueList ];
    const map = {};
    let temp;
    if (!playNow) {
      return;
    }
    // 保证当前歌曲第一个，剩下歌曲随机顺序
    const length = arr.length;
    for (let i = length - 1; i > 1; i--) {
      const r = Math.floor(Math.random() * i);
      temp = arr[r];
      arr[r] = arr[i];
      arr[i] = temp;
    }
    arr.forEach((k) => map[k] = true);
    const nowI = arr.indexOf(playNow.aId);
    if (nowI >= 0) {
      temp = arr[0];
      arr[0] = arr[nowI];
      arr[nowI] = temp;
    }
    playingList.random = [ ...arr ];
    playingList.map = map;
  },
  [types.UPDATE_SHOW_COVER](state, data) {
    state.showCoverImg = data;
  },

  // 更新评论信息
  [types.UPDATE_COMMENT_INFO](state, data) {
    state.commentInfo = data;
  },

  // 更新下载记录
  [types.UPDATE_DOWNLOAD](state, data) {
    if (!data) {
      // 第一次进来的渲染
      const downloadInfo = Storage.get('download_info', true);
      downloadInfo.count = 0;
      downloadInfo.list.forEach((obj) => {
        if (obj.status === 'progress') {
          obj.status = 'error';
          obj.errMsg = '下载被中断了';
          delete obj.ajax;
          delete obj.p;
          delete obj.t;
          delete obj.l;
        }
      });
      state.downloadInfo = downloadInfo;
    } else {
      const { id, aId, p, l, t, ajax, status, errMsg, name, songId, br, from, songCid, song } = data;
      const { downloadInfo } = state;
      const d = downloadInfo.list.find((item) => item.id === id);
      const now = new Date().getTime();
      // 这是其他的更新下载状态
      switch (status) {
        case 'init':
          downloadInfo.list.unshift({ status, from, aId, id, startTime: now, ajax, name, songId, songCid, br, song });
          downloadInfo.count++;
          break;
        case 'initError':
          downloadInfo.list.unshift({ status: 'error', from, aId, id, errMsg, name, song, songId, songCid, br, startTime: now, endTime: now });
          break;
        case 'success':
          d.status = 'success';
          d.endTime = now;
          delete d.ajax;
          delete d.p;
          delete d.t;
          delete d.l;
          break;
        case 'error':
          d.errMsg = errMsg || '未知错误';
          d.endTime = now;
          delete d.ajax;
          delete d.p;
          delete d.t;
          delete d.l;
          break;
        case 'progress':
          d.p = Num(p * 100, 2);
          d.t = t;
          d.l = l;
          d.status = 'progress';
          break;
        case 'clear':
          downloadInfo.list = downloadInfo.list.filter((o) => ['init', 'progress'].indexOf(o.status) > 0);
          break;
        case 'clearError':
          downloadInfo.list = downloadInfo.list.filter((o) => o.status !== 'error');
          break;
        case 'abort':
          d.ajax && d.ajax.abort && d.ajax.abort();
          d.errMsg ='主动结束';
          d.endTime = now;
          d.status = 'error';
          delete d.ajax;
          delete d.p;
          delete d.t;
          delete d.l;
          break;
        case 'abortAll':
          downloadInfo.list.forEach((item) => {
            if (['init', 'progress'].indexOf(item.status) >= 0) {
              item.ajax && item.ajax.abort && item.ajax.abort();
              item.errMsg ='主动结束';
              item.status = 'error';
              item.endTime = now;
              delete item.ajax;
              delete item.p;
              delete item.t;
              delete item.l;
            }
          });
          break;
        default: break;
      }
      downloadInfo.count = downloadInfo.list.filter((o) => ['init', 'progress'].indexOf(o.status) > -1).length;
      Storage.set('download_info', downloadInfo, true);
      state.downloadInfo = { ...downloadInfo };
    }
  },
  [types.PERSON_FM](state, data) {
    const { playingList } = state;
    if (!state.isPersonFM) {
      playingList.raw = data;
      playingList.history = [];
      playingList.index = 0;
      playingList.random = data;
      playingList.trueList = data;
    } else {
      const newList = ArrHelper.delDuplicate(playingList.raw || [], data);

      playingList.raw = newList;
      playingList.trueList = newList;
      playingList.random = newList;
    }
    state.playingListId = '';
    state.isPersonFM = true;
  },

  // 更新 qq 用户歌单
  [types.UPDATE_Q_USER_LIST](state, data) {
    state.qUserList = data;
  },

  [types.UPDATE_MODE](state, data) {
    state.mode = data;
  },
  [types.SET_LOADING](state, data) {
    state.loading = data;
  },
  [types.UPDATE_FAV_SONG_MAP](state, data) {
    state.favSongMap = {
      ...state.favSongMap,
      ...data,
    }
  },
  [types.UPDATE_TOP_INFO](state, data) {
    state.topInfo = {
      ...state.topInfo,
      ...data,
    }
  },
  [types.SET_HOME_TYPE](state, data) {
    state.homeType = data;
  }
}