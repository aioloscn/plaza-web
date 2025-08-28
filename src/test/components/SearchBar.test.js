import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/common/SearchBar.vue'

describe('SearchBar 组件', () => {
  it('应该正确渲染', () => {
    const wrapper = mount(SearchBar, {
      props: {
        placeholder: '搜索商家或美食'
      }
    })
    
    expect(wrapper.find('input').attributes('placeholder')).toBe('搜索商家或美食')
  })

  it('应该响应输入事件', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    
    await input.setValue('测试搜索')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['测试搜索'])
  })

  it('应该响应搜索事件', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: '测试关键词'
      }
    })
    
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')[0]).toEqual(['测试关键词'])
  })
})