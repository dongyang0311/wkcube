// 融资文件
import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { Link } from 'react-router'
import { updateLoading, updateBorrowing } from 'actions/'
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
export default class FinancingContractContent extends Component {
  constructor (props) {
    super(props)
    let { borrowing } = this.props.state
    this.state = {
      content: borrowing.contract, //
      contenttitle: borrowing.contracttitle
    }
  }
  componentDidMount () {
    let { updateLoading } = this.props.actions
    updateLoading(false)
  }
  historyBack () {
    window.history.back()
  }
  render () {
    let {content, contenttitle} = this.state
    return (
      <section className="loanIndex cashLoanIndex contractlist">
        <header onClick={this.historyBack.bind(this)} style={{position: 'fixed'}}>{contenttitle}</header>
        <div dangerouslySetInnerHTML={{__html: content}} style={{marginTop: '3.62rem'}} />
      </section>
    )
  }
}
