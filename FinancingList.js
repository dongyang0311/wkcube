// 融资文件
import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { Link } from 'react-router'
import { updateLoading, updateBorrowing } from 'actions/'
import fetch from 'lib/http'
import session_storage from 'lib/session_storage'
import { updateToastMessage } from 'fetchActions/updateToastMessage'

const mapDispatchToProps = dispatch => {
  return {
    actions: {
      updateLoading: (flag) => dispatch(updateLoading(flag)),
      updateToastMessage: (params) => dispatch(updateToastMessage(params)),
      updateBorrowing: (params) => dispatch(updateBorrowing(params))
    }
  }
}
const mapStateToProps = state => {
  return {
    state: {
      borrowing: state.borrowing,
      api: state.api
    }
  }
}
@connect(mapStateToProps, mapDispatchToProps)
export default class Financinglist extends Component {
  constructor (props) {
    super(props)
    // let { borrowing } = this.props.state
    this.state = {
      listTitleAll: [], //
      selectList: '',
      flag: true,
      financing_select: []
    }
  }
  componentWillMount () {
    let { api } = this.props.state
    let { updateToastMessage, updateLoading } = this.props.actions
    fetch({
      url: api.CONTRACTLIST,
      data: {
        productId: session_storage.getItem('productId')
      }
    }).then((res) => {
      if (res.status == '1') {
        updateLoading(false)
        this.setState({listTitleAll: res.data.contract, financing_select: Object.keys(res.data.contract)})
        // console.log(this.state.financing_select)
      } else {
        updateToastMessage({message: res.message})
      }
    }).then(() => {
      updateLoading(false)
    })
  }
  historyBack () {
    window.history.back()
  }
  selectList (content, title) {
    let { updateBorrowing } = this.props.actions
    updateBorrowing({contract: content, contracttitle: title})
    this.props.router.push('/FinancingContractContent')
  }
  select (key) {
    // console.log("key"+key)
    // console.log(this.state.financing_select)
    // console.log(this.state.financing_select.toString().indexOf(key.toString()) != -1)
    // this.setState({financing_select: !this.state.financing_select})
    let { financing_select, listTitleAll } = this.state
    let { updateBorrowing } = this.props.actions
    if (financing_select.indexOf(key.toString()) != -1) { // 有key 去掉
      for (let i = 0; i < financing_select.length; i++) {
        if (financing_select[i] == key.toString()) {
          financing_select.splice(i, 1)
        }
      }
    } else { // 没有 添加
      financing_select.push(key.toString())
    }
    // console.log(financing_select)
    this.setState({financing_select: financing_select})
    if (financing_select.length == listTitleAll.length) {
      this.setState({flag: true})
    } else {
      this.setState({flag: false})
      updateBorrowing({financing_submint: false})
    }
  }
  next () {
    let { updateBorrowing, updateToastMessage } = this.props.actions
    // let { borrowing } = this.props.state
    let {financing_select, listTitleAll, flag} = this.state
    if ((financing_select.length == listTitleAll.length) && flag) { // 判断是否全部选中
      updateBorrowing({financing_submint: true})
      window.history.go(-1)
    } else {
      updateToastMessage({message: '请选中全部合同'})
      // updateBorrowing({financing_submint: !borrowing.financing_submint})
    }
  }
  render () {
    let {listTitleAll, flag} = this.state
    return (
      <section className="loanIndex cashLoanIndex">
        <header onClick={this.historyBack.bind(this)}>分期服务协议和文件</header>
        <ul>
          {
              listTitleAll.map((val, key) => {
                return <li key={key} className="financing financing_b">
                        <em className="financingList" className={(this.state.financing_select.indexOf(key.toString()) != -1) ? 'financingList' : 'financingList1'} onClick={this.select.bind(this, key)}></em>
                        <a onClick={this.selectList.bind(this, val.content, val.title)}>{val.title}</a></li>
              })
          }
        </ul>
        <button className={flag ? 'cashloanB' : 'cashloanB bbgb'} onClick={this.next.bind(this)}>我已全部知晓并确认</button>
      </section>
    )
  }
}
