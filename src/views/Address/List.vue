<template>
  <div class="address-list-page">
    <van-nav-bar
      title="收货地址"
      left-arrow
      @click-left="onClickLeft"
    />
    <van-address-list
      v-model="chosenAddressId"
      :list="list"
      default-tag-text="默认"
      @add="onAdd"
      @edit="onEdit"
      @select="onSelect"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { addressApi } from '@/api';
import { useUserStore } from '@/store/modules/user';
import { showToast } from 'vant';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const chosenAddressId = ref('');
const list = ref([]);
const isSelectMode = route.query.select === 'true';

const loadList = async () => {
  try {
    const data = await addressApi.list();
    
    let items = [];
    if (Array.isArray(data)) {
        items = data;
    } else if (data && Array.isArray(data.data)) {
        items = data.data;
    } else if (data && Array.isArray(data.records)) {
        items = data.records;
    }

    list.value = items.map(item => ({
      id: item.id,
      name: item.name,
      tel: item.tel,
      address: `${item.province}${item.city}${item.county}${item.addressDetail}`,
      isDefault: !!item.isDefault,
      // Keep original data for editing if needed
      original: item
    }));
    
    // Set default selected if none selected (or first default)
    if (!chosenAddressId.value) {
        // If coming back from selection, keep selection? 
        // Or if in select mode, check session?
        const selectedId = sessionStorage.getItem('selected_address_id');
        if (selectedId && list.value.find(i => String(i.id) === String(selectedId))) {
             chosenAddressId.value = Number(selectedId);
        } else {
             const defaultAddr = list.value.find(item => item.isDefault);
             if (defaultAddr) chosenAddressId.value = defaultAddr.id;
        }
    }
  } catch (error) {
    console.error(error);
    showToast('加载地址失败');
  }
};

const onAdd = () => {
  router.push('/address/edit');
};

const onEdit = (item, index) => {
  // van-address-list 的 edit 事件回调参数是 (item, index)
  router.push(`/address/edit?id=${item.id}`);
};

const onSelect = (item) => {
  if (isSelectMode) {
    sessionStorage.setItem('selected_address_id', item.id);
    router.go(-1);
  }
};

const onClickLeft = () => router.go(-1);

onMounted(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.address-list-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 50px;
}
</style>
