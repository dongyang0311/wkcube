// 上传身份证照片
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { updateToastMessage } from 'fetchActions/updateToastMessage'
import { updateLoading } from 'actions/'
import { fechUserPhoto } from 'fetchActions/fechUserPhoto'
import { fetchBaseUserInfo } from 'fetchActions/fetchBaseUserInfo'
import { fetchOneCardInfo } from 'fetchActions/fetchOneCardInfo'
import lrz from 'lib/lrz.all.bundle'
import fetch from 'lib/http'
import session_storage from 'lib/session_storage'
import { is_android, is_weixn } from 'lib/until'
// action映射
const mapDispatchToProps = dispatch => {
  return {
    actions: {
      updateToastMessage: (params) => dispatch(updateToastMessage(params)),
      fechUserPhoto: (params) => dispatch(fechUserPhoto(params)),
      fetchBaseUserInfo: (params) => dispatch(fetchBaseUserInfo(params)),
      updateLoading: (flag) => dispatch(updateLoading(flag)),
      fetchOneCardInfo: (params) => dispatch(fetchOneCardInfo(params))
    }
  }
}

// 将state绑定到props的state
const mapStateToProps = state => {
  return {
    state: {
      userInfo: state.userInfo,
      config: state.config,
      api: state.api,
      routing: state.routing,
      dentityInfo: state.dentityInfo,
      oneCardInfo: state.oneCardInfo
    }
  }
}
@connect(mapStateToProps, mapDispatchToProps)
export default class CashLoanAd extends Component {
  constructor (props) {
    super(props)
    this.state = {
      J1201: {url: require('icon/wk/example1.png'), status: ''},
      J1202: {url: require('icon/wk/example2.png'), status: ''},
      J1205: {url: require('icon/wk/example3.png'), status: ''},
      loadFlag: false,
      tooltipsFlag: true,
      isErrorTip: ''
    }
  }
  componentWillMount () {
    let { fechUserPhoto, updateLoading, fetchBaseUserInfo } = this.props.actions
    let { userInfo } = this.props.state
    fechUserPhoto()
    .then(() => {
      let { baseInfo } = this.props.state.userInfo
      if (baseInfo.idCardPhotos && baseInfo.idCardPhotos.length > 0) {
        baseInfo.idCardPhotos.map((val, item) => {
          let obj = {}
          obj[val.attachPurpose] = {}
          obj[val.attachPurpose]['url'] = val.attachUrl
          obj[val.attachPurpose]['status'] = val.attachStatus
          this.setState(obj)
        })
      }
    }).then(() => {
      // 首先从redux里面获取name和certId,如果这两个都是空字符串，调用接口获取用户基本信息
      if (userInfo.baseInfo.name == '' || userInfo.baseInfo.certId == '') {
        fetchBaseUserInfo()
      }
    }).then(() => {
      updateLoading(false)
    })
  }
  componentWillUnmount () {
    // window.localStorage.setItem('completeInfo', 'completeInfo')
  }
  // 上传身份证照片
  uploadImg (type, status) {
    let { updateToastMessage } = this.props.actions
    if (status == 'J1103' || status == 'J1104') {
      updateToastMessage({
        message: status == 'J1103' ? '照片待审核中' : '照片审核已通过'
      })
      return false
    }
    let { api } = this.props.state
    let that = $("#file"+type).get(0)
    if (that == null || this.refs['img'+type].files.length == 0) { return false }
    // this.setState({loadFlag: true})
    lrz(this.refs['img'+type].files[0], {
      width: 800
    }).then(res => {
      this.setState({loadFlag: true})
      fetch({
        url: api.QUERY_RESULT
      }).then((grayRes) => {
        if (grayRes.status == '1') {
          if (grayRes.data.gray == 'F') {
            window.location.href = '' // 跳转到系统维护页面
            return false
          } else {
            this.uploadBase64(res.base64, type)
          }
        } else {
          updateLoading(false)
          updateToastMessage({
            message: grayRes.message
          })
        }
      })
    }, () => {
      console.log('图片失败')
    })
  }
  uploadBase64 (attachBase64, attachPurpose) {
    let { api } = this.props.state
    let { updateToastMessage } = this.props.actions
    fetch({
      url: api.ATTACH_UPLOAD,
      data: {
        attachPurpose,
        attachType: 'jpg',
        attachBase64
      }
    }).then(data => {
      if (data.status == 1) {
        let obj = {}
        obj[attachPurpose] = {}
        obj[attachPurpose]['url'] = attachBase64
        obj[attachPurpose]['status'] = 'J1101'
        this.setState(obj)
        this.setState({loadFlag: false})
      } else if (data.status == 1008) {
      } else {
        updateToastMessage(data.message)
      }
    })
  }
  // 查看提示
  checktooltips () {
    this.setState({'tooltipsFlag': true})
  }
  // 关闭查看提示
  closetooltips () {
    this.setState({'tooltipsFlag': false})
  }

  // 下载
  downloads () {
    let { config } = this.props.state
    debugger
    if (is_android()) {
      if (is_weixn()) {
        window.location.href = config.downLoadUrl // 跳转到下载页面 10月 17日 修改
      } else {
        window.location.href = "//"
      }
    } else {
      if (is_weixn()) {
        window.location.href = config.downLoadUrl // 跳转到下载页面 10月 17日 修改
      } else {
        window.location.href = "//"
      }
    }
  }
  // 确定按钮
  confirmUpload () {
    let { J1201, J1202, J1205 } = this.state
    let { api } = this.props.state
    let { updateToastMessage } = this.props.actions
    // let { userStatus } = this.props.state.userInfo
    // let { quotaAppStatus } = userStatus
    if (J1201.status == '') {
      this.setState({isErrorTip: '请上传身份证正面'})
      return false
    }
    if (J1202.status == '') {
      this.setState({isErrorTip: '请上传身份证背面'})
      return false
    }
    if (J1205.status == '') {
      this.setState({isErrorTip: '请上传手持身份证半身照'})
      return false
    }
    if (J1201.status == 'J1105') {
      this.setState({isErrorTip: '请重新上传身份证正面'})
      return false
    }
    if (J1202.status == 'J1105') {
      this.setState({isErrorTip: '请重新上传身份证背面'})
      return false
    }
    if (J1205.status == 'J1105') {
      this.setState({isErrorTip: '请重新上传手持身份证半身照'})
      return false
    }
    this.setState({isErrorTip: ''})
    let { fetchOneCardInfo } = this.props.actions
    fetchOneCardInfo()
    .then(() => {
      let { quotaAppStatus } = this.props.state.oneCardInfo
      if (quotaAppStatus == '4') {
        fetch({
          url: api.MODIFYSTATUS
        }).then(data => {
          if (data.status == 1) {
            session_storage.setItem('wk', '1')
            window.history.go(-1)
            // this.props.router.push('/transition')
            // this.props.router.push('/completeInfo')
          } else if (data.status == 1008) {
          } else {
            updateToastMessage(data.message)
            return false
          }
        })
      } else {
        session_storage.setItem('wk', '1')
        window.history.go(-1)
      }
    })
  }
  render () {
    let { baseInfo } = this.props.state.userInfo
    let { J1201, J1202, J1205, loadFlag, isErrorTip, tooltipsFlag } = this.state
    return (
      <section className="id_photo">
        <p className="info"><span id="userName">{baseInfo.name}</span> <span id="phone">{baseInfo.certId}</span></p>
          <ul className="container">
             <li className="clearfix">
              <img className="clearfix_img" onClick={this.checktooltips.bind(this)} src={require('icon/wk/icon/question.png')} alt="" />
              <p>请拍摄身份证正面照</p>
              <div className="listWrap">
                  <span id="borderJ1201" className={J1201.status != ''? 'border': ''}>
                    <img id="imgJ1201" src={J1201.url} alt="" className="m"/>
                  </span>
                  <input id="fileJ1201" accept="image/*" type="file" capture="camera" ref="imgJ1201" onChange={this.uploadImg.bind(this, "J1201", J1201.status)}/>
                  <span className={ J1201.status == '' ? '' : (J1201.status == 'J1105' ? 'tip': 'tip right')} id="spanJ1201"></span>
              </div>
            </li>
            <li className="clearfix">
              <p>请拍摄身份证背面照</p>
              <div className="listWrap">
                <span id="borderJ1202" className={J1202.status != ''? 'border': ''}><img id="imgJ1202" src={J1202.url} alt="" className="m"/></span>
                <input id="fileJ1202" accept="image/*" type="file" capture="camera" ref="imgJ1202" onChange={this.uploadImg.bind(this, "J1202", J1202.status)}/>
                <span className={J1202.status == '' ? '' : (J1202.status == 'J1105' ? 'tip': 'tip right')} id="spanJ1202"></span>
              </div>
            </li>
            <li className="clearfix">
              <p>请拍摄借款人的手持身份证照</p>
              <div className="listWrap">
                <span id="borderJ1205" className={J1205.status != ''? 'border': ''}><img id="imgJ1205" src={J1205.url} alt="" className="m"/></span>
                <input id="fileJ1205" accept="image/*" type="file" capture="camera" ref="imgJ1205" onChange={this.uploadImg.bind(this, "J1205", J1205.status)}/>
                <span className={J1205.status == '' ? '' : (J1205.status == 'J1105' ? 'tip': 'tip right')} id="spanJ1205"></span>
              </div>
            </li>
            {
              isErrorTip == ''? '': <div className="error">{isErrorTip}</div>
            }
            <button className="btn" onClick={this.confirmUpload.bind(this)}>确认上传</button>
         </ul>
         {
           loadFlag? <div className="bodyid">
             <div className="loading">
               <img src={require('icon/loading.gif')}/>
               <br/>
               <p className="loading_p">上传中，请耐心等候...</p>
             </div>
           </div> : ''
         }
         <section className={tooltipsFlag ? '' : 'hidden'}>
           <div className="maskwk"></div>
           <div className="alertText sm">
             <h6>提示</h6>
             <p className="tooltips">
               请保持面部与身份证清晰且互不遮挡，手持身份证需露出小臂、手肘和肩膀，有助于您快速通过审核！
             </p>
             <p className="tooltips" style={{color: '#F27274'}}>若无法提供身份证照片，可以通过【******APP】做人脸识别。</p>
             <button id="closeShow" onClick={this.closetooltips.bind(this)}>我知道了</button>
             <button id="closeShow" onClick={this.downloads.bind(this)}>下载APP</button>
           </div>
         </section>
         </section>
    )
  }
}
